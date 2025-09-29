import React, { useState, useEffect, ReactNode } from "react";
import { toTermQueries } from "./utils";
import { useSharedContext } from "./SharedContextProvider";

export interface FacetItem {
  key: string;
  doc_count: number;
}

export interface FacetProps {
  fields: string[];
  id: string;
  initialValue?: string[];
  seeMore?: string;
  placeholder?: string;
  showFilter?: boolean;
  filterValueModifier?: (value: string) => string;
  itemsPerBlock?: number;
  items?: (
    data: FacetItem[],
    options: {
      handleChange: (item: FacetItem, checked: boolean) => void;
      isChecked: (item: FacetItem) => boolean;
    }
  ) => ReactNode;
}

export default function Facet({
  fields,
  id,
  initialValue,
  seeMore,
  placeholder,
  showFilter = true,
  filterValueModifier,
  itemsPerBlock,
  items,
}: FacetProps) {
  const [{ widgets }, dispatch] = useSharedContext();
  // Current filter (search inside facet value).
  const [filterValue, setFilterValue] = useState("");
  // Number of items displayed in facet.
  const [size, setSize] = useState(itemsPerBlock || 5);
  // The actual selected items in facet.
  const [value, setValue] = useState<string[]>(initialValue || []);
  // Data from internal queries (Antfly queries are performed via Listener)
  const widget = widgets.get(id);
  const { result } = widget || {};
  const data: FacetItem[] = (result && result.data as FacetItem[]) || [];
  const total = (result && result.total) || 0;

  // Update widgets properties on state change.
  useEffect(() => {
    dispatch({
      type: "setWidget",
      key: id,
      needsQuery: true,
      needsConfiguration: true,
      isFacet: true,
      wantResults: false,
      query: { disjuncts: toTermQueries(fields, value) },
      value,
      configuration: { size, filterValue, fields, filterValueModifier },
      result: data && total ? { data, total } : undefined,
    });
  }, [dispatch, id, size, filterValue, value, fields, filterValueModifier, data, total]);

  // If widget value was updated elsewhere (ex: from active filters deletion)
  // We have to update and dispatch the component.
  // useEffect(() => {
  //   widgets.get(id) && setValue(widgets.get(id).value);
  // }, [isValueReady()]);
  //
  // The original useEffect with isValueReady() in the dependency array
  // was causing the effect to run on every render,  constantly resetting the
  // local state back to the widget's value and preventing the
  // checkbox selection from persisting.
  //
  // The new approach only syncs the local state when the widget's actual value
  // changes from external sources (like active filter removal), which is
  // what was intended.
  useEffect(() => {
    const widget = widgets.get(id);
    if (widget && Array.isArray(widget.value) && widget.value !== value) {
      setValue(widget.value);
    }
  }, [widgets.get(id)?.value, id, value]);

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), [dispatch, id]);

  // On checkbox status change, add or remove current agg to selected
  function handleChange(item: FacetItem, checked: boolean) {
    const newValue = checked
      ? [...new Set([...value, item.key])]
      : value.filter((f) => f !== item.key);
    setValue(newValue);
  }

  // Is current item checked?
  function isChecked(item: FacetItem): boolean {
    return value.includes(item.key);
  }

  return (
    <div className="react-af-facet">
      {showFilter ? (
        <input
          value={filterValue}
          placeholder={placeholder || "filter…"}
          type="text"
          onChange={(e) => {
            setFilterValue(e.target.value);
          }}
        />
      ) : null}
      {items
        ? items(data, { handleChange, isChecked })
        : data.map((item) => (
            <label key={item.key}>
              <input
                type="checkbox"
                checked={isChecked(item)}
                onChange={(e) => handleChange(item, e.target.checked)}
              />
              {item.key} ({item.doc_count})
            </label>
          ))}
      {data.length === size ? (
        <button onClick={() => setSize(size + (itemsPerBlock || 5))}>
          {seeMore || "see more"}
        </button>
      ) : null}
    </div>
  );
}