/**
 * The one file you edit after deploying.
 *
 * SHEET_URL — where visitor answers go.
 *   1. Open the Google Sheet you want the answers in.
 *   2. Extensions -> Apps Script, paste the contents of google/Code.gs.
 *   3. Deploy -> New deployment -> Web app.
 *        Execute as:  Me
 *        Who has access:  Anyone
 *   4. Copy the /exec URL it gives you and paste it below.
 *
 * Until this is filled in, the form tells visitors submissions aren't open
 * yet instead of pretending a send worked.
 */
export const CONFIG = {
  SHEET_URL: "https://script.google.com/macros/s/AKfycby2IeJ7UlFGfZyhGjPR4BGjYKTGFKYoeT26My4wa1mrzckS4CpKpQl39tM_ErIUl11S/exec",

  // Written answers appear on the page the moment they're sent. To pull a bad
  // one, put TRUE in the `hidden` column of the sheet row. Filmed answers are
  // never shown — they wait in the "QTD video answers" Drive folder.
  SHOW_SUBMISSIONS: true,
};
