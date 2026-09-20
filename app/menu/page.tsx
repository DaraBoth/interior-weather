import Link from "next/link";
import type { Metadata } from "next";
import { ROOMS } from "@/lib/rooms";

/**
 * The menu, as a page rather than an overlay.
 *
 * It used to be a full-screen dialog opened from a bar pinned to the top of
 * every room. The bar was the problem: it sat over the game on a phone, and a
 * dialog has no address, so nothing could link to it and the phone's own Back
 * gesture did not leave it. Now it is a route. Every room carries one back
 * button that returns here, and the rooms themselves get the whole screen.
 */

export const metadata: Metadata = { title: "ជ្រើសរើសបន្ទប់" };

export default function Menu() {
  return (
    <div className="menuscreen">
      <div className="menuhead">
        <div>
          <div className="mk">ក្រសួងផឹកភ្លាម</div>
          <h2>ជ្រើសរើសបន្ទប់</h2>
        </div>
      </div>

      <div className="menugrid">
        {ROOMS.map((r) => (
          <Link key={r.href} href={r.href} className="menucard">
            <span className="menulabel">{r.label}</span>
            <span className="menunote">{r.note}</span>
          </Link>
        ))}
      </div>

      <p className="menufoot">ជណ្តើរយន្តខូច · សូមប្រើជណ្តើរ</p>
    </div>
  );
}
