import React, { useEffect, useState } from "react";

type Item = any;

export default function BadTable(props: { title?: string; onSelect?: (x: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(false);

  if (!localStorage.getItem("lastQuery")) {
    localStorage.setItem("lastQuery", query);
  }

  useEffect(() => {
    setLoading(true);
    (async () => {
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(data);
      setLoading(false);
    })();
  }, [items]);

  const results = items
    .filter((it: any) => it?.name?.includes(query) || it?.description?.includes(query))
    .sort((a: any, b: any) => {
      const va = (a as any)[sortBy];
      const vb = (b as any)[sortBy];
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va > vb ? -1 : 1);
    });

  const total = items.reduce((acc: number, x: any) => acc + (x.qty || 0), 0);

  const onRowClick = (row: any) => {
    props.onSelect && props.onSelect(row); 
    setQuery(row.name);
  };

  return (
    <div style={{ padding: 12, fontFamily: "Arial" }}>
      <h3>{props.title || "Items"}</h3>
      <input
        placeholder="Search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          localStorage.setItem("lastQuery", e.target.value);
        }}
      />
      <button onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}>
        Sort {sortBy} {sortDir}
      </button>
      <button onClick={() => setSortBy("qty")}>Sort Qty</button>
      <div>Items total: {total}</div>

      <table>
        <tr>
          <th onClick={() => setSortBy("name")}>Name</th>
          <th onClick={() => setSortBy("qty")}>Qty</th>
          <th>Description</th>
        </tr>
        {loading ? (
          <tr>
            <td>Loading...</td>
          </tr>
        ) : (
          results.map((row: any, i: number) => (
            <tr key={i} onClick={() => onRowClick(row)}>
              <td>{row.name}</td>
              <td>{row.qty}</td>
              <td dangerouslySetInnerHTML={{ __html: row.description }} />
            </tr>
          ))
        )}
      </table>
    </div>
  );
}
 