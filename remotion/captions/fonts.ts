import { loadFont as loadBangers } from "@remotion/google-fonts/Bangers";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { loadFont as loadRaleway } from "@remotion/google-fonts/Raleway";
import { loadFont as loadLato } from "@remotion/google-fonts/Lato";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadAlfaSlabOne } from "@remotion/google-fonts/AlfaSlabOne";
import { loadFont as loadPermanentMarker } from "@remotion/google-fonts/PermanentMarker";
import { loadFont as loadRubik } from "@remotion/google-fonts/Rubik";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";
import { loadFont as loadClashDisplay } from "@remotion/google-fonts/Syne";
import { loadFont as loadLexend } from "@remotion/google-fonts/Lexend";
import { loadFont as loadTitilliumWeb } from "@remotion/google-fonts/TitilliumWeb";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadRubikMonoOne } from "@remotion/google-fonts/RubikMonoOne";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadQuicksand } from "@remotion/google-fonts/Quicksand";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadPlusJakartaSans } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";

const bangers = loadBangers();
const inter = loadInter();
const montserrat = loadMontserrat();
const poppins = loadPoppins();
const oswald = loadOswald();
const roboto = loadRoboto();
const raleway = loadRaleway();
const lato = loadLato();
const nunito = loadNunito();
const bebasNeue = loadBebasNeue();
const alfaSlabOne = loadAlfaSlabOne();
const permanentMarker = loadPermanentMarker();
const rubik = loadRubik();
const spaceGrotesk = loadSpaceGrotesk();
const dmSans = loadDMSans();
const archivo = loadArchivo();
const syne = loadClashDisplay();
const lexend = loadLexend();
const titilliumWeb = loadTitilliumWeb();
const anton = loadAnton();
const rubikMonoOne = loadRubikMonoOne();
const fredoka = loadFredoka();
const quicksand = loadQuicksand();
const caveat = loadCaveat();
const plusJakartaSans = loadPlusJakartaSans();
const outfit = loadOutfit();

export const comicFont = bangers.fontFamily;
export const waitForFont = bangers.waitUntilDone;

export const FONT_FAMILIES: Record<string, string> = {
  comic: bangers.fontFamily,
  inter: inter.fontFamily,
  montserrat: montserrat.fontFamily,
  poppins: poppins.fontFamily,
  oswald: oswald.fontFamily,
  roboto: roboto.fontFamily,
  raleway: raleway.fontFamily,
  lato: lato.fontFamily,
  nunito: nunito.fontFamily,
  bebasNeue: bebasNeue.fontFamily,
  alfaSlabOne: alfaSlabOne.fontFamily,
  permanentMarker: permanentMarker.fontFamily,
  rubik: rubik.fontFamily,
  spaceGrotesk: spaceGrotesk.fontFamily,
  dmSans: dmSans.fontFamily,
  archivo: archivo.fontFamily,
  syne: syne.fontFamily,
  lexend: lexend.fontFamily,
  titilliumWeb: titilliumWeb.fontFamily,
  anton: anton.fontFamily,
  rubikMonoOne: rubikMonoOne.fontFamily,
  fredoka: fredoka.fontFamily,
  quicksand: quicksand.fontFamily,
  caveat: caveat.fontFamily,
  plusJakartaSans: plusJakartaSans.fontFamily,
  outfit: outfit.fontFamily,
};

export function getFontFamily(key: string): string {
  return FONT_FAMILIES[key] ?? inter.fontFamily;
}
