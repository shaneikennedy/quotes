import { LocalStorage } from "@raycast/api";

export async function addFavoriteToStorage(symbol: string): Promise<void> {
  let favs = await LocalStorage.getItem<string>("favorites");
  if (favs) {
    favs += "," + symbol;
  } else {
    favs = symbol;
  }
  await LocalStorage.setItem("favorites", favs);
}

export async function removeFavoriteFromStorage(symbol: string): Promise<void> {
  let storage = await LocalStorage.getItem<string>("favorites");
  if (storage) {
    // if we're calling remove this should never be undefined
    const favs = storage.split(",");
    let newFavs: Array<string>;
    if (favs.length === 1 && favs[0] == symbol) {
      newFavs = [];
    } else {
      newFavs = favs.filter((ticker: string) => ticker !== symbol);
    }
    await LocalStorage.setItem("favorites", newFavs.join(","));
  }
}

export async function loadFavorites(): Promise<Array<string>> {
  const storage = await LocalStorage.getItem<string>("favorites");
  if (storage != undefined) {
    return storage.split(",");
  }
  return [];
}
