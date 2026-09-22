/**
 * Navigates by synthesizing a real anchor click, rather than assigning
 * window.location.
 *
 * Chromium (and CEF, which is what the /3d flow's Unreal Engine web widget embeds)
 * classifies every top-level navigation by a "transition type": a genuine link click
 * is PAGE_TRANSITION_LINK; a form submission is PAGE_TRANSITION_FORM_SUBMIT; but
 * window.location.href / .replace() / .assign() and next/navigation's router are all
 * PAGE_TRANSITION_CLIENT_REDIRECT — a script-triggered redirect, a distinct category
 * from either. Many embedded-browser-as-game-UI integrations (this app's /3d flow
 * among them, per its own observed behavior) gate which transition types are actually
 * allowed to navigate the widget, specifically to stop arbitrary embedded content from
 * redirecting itself — and CLIENT_REDIRECT is exactly the category most likely to be
 * filtered out there, while LINK is not, since it's indistinguishable from the user
 * having clicked something themselves.
 *
 * This was arrived at after window.location.replace() (a plain hard navigation) was
 * confirmed to still not work inside that widget despite working in every real
 * browser tested — i.e. this isn't a browser-compatibility gap like the color-mix()/
 * @layer fixes elsewhere in this flow, it's the widget's own navigation policy, and a
 * synthesized click is the best available way to present a navigation attempt that
 * such a policy is likely to treat the same as a real one.
 */
export function hardNavigate(url: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
