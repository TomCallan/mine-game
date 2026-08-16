// ===========================================================
// MINER'S HAVEN - DATA REPOSITORY (LOADS FROM data.json)
// ===========================================================

let GAME_DATA = null;

async function loadGameData() {
  try {
    const res = await fetch('data.json');
    if (res.ok) {
      GAME_DATA = await res.json();
      return GAME_DATA;
    }
  } catch (e) {
    console.warn('[Data] Fetching data.json failed, using inline bundle.', e);
  }
  return null;
}
