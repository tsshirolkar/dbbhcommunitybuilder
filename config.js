/* Community Builder settings. This is the only file you edit to switch between prototype and live.
   mode "local"    : no database. Data stays in each visitor's browser, with fictional sample members. (GitHub Pages ready)
   mode "supabase" : real shared database. Run setup.sql first, then fill in url and key below. */
window.CB_CONFIG = {
  mode: "local",
  url: "",       // Supabase project URL (only for mode "supabase")
  key: "",       // Supabase publishable key (only for mode "supabase")
  homeUrl: ""    // optional: link back to the main dBBH site, e.g. "https://yoursite.org"
};
