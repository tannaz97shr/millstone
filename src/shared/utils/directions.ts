/** A Google Maps search for an address, for "Get directions" links. Branch addresses are all in Victoria. */
export function directionsUrl(address: string): string {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${address} VIC` })}`;
}
