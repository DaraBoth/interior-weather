/**
 * Every room in the building, in the order they appear on the menu page.
 *
 * Lives here rather than in the nav component because the menu is a route of
 * its own now, not an overlay: /menu renders this list, and the shell only
 * needs it to name the room you are standing in.
 */

export type Room = { href: string; label: string; note: string };

export const ROOMS: Room[] = [
  { href: "/",         label: "កន្លែងទទួលភ្ញៀវ", note: "ម៉ាស៊ីនអារម្មណ៍ និងប៊ូតុងក្រហម" },
  { href: "/bomb",     label: "គ្រាប់បែក",        note: "និយាយ បញ្ជូនបន្ត កុំឱ្យផ្ទុះដាក់ខ្លួន" },
  { href: "/wheel",    label: "កង់មូល",           note: "បង្វិល រួចទទួលយកផលវិបាក" },
  { href: "/paranoia", label: "ការសង្ស័យ",        note: "សំណួរខ្សឹប ចម្លើយឮៗ" },
  { href: "/freeze",   label: "កក",               note: "កុំកម្រើក កាមេរ៉ាកំពុងមើល" },
  { href: "/cards",    label: "ធំ ឬ តូច",         note: "ទាយបៀ ខុសគឺផឹក" },
  { href: "/pick",     label: "នរណាផឹក",          note: "បន្ទប់ជ្រើសរើសមនុស្សម្នាក់" },
  { href: "/mimic",    label: "ត្រាប់តាមសំឡេង",   note: "បញ្ចេញសំឡេង យើងឱ្យពិន្ទុ" },
  { href: "/drink",    label: "ច្បាប់",           note: "ច្បាប់ ការសារភាព និងការប្រកួត" },
  { href: "/fun",      label: "ល្បែង",            note: "ហ្គេមតូចៗគ្មានតម្លៃ" },
  { href: "/bored",    label: "ការរង់ចាំ",        note: "នាយកដ្ឋានរង់ចាំ" },
  { href: "/form",     label: "ទម្រង់ ២៧-ខ",      note: "ពាក្យសុំដាក់ពាក្យ" },
  { href: "/archive",  label: "បណ្ណសារ",          note: "ជាន់ទី -១ តម្រុយនៅទីនេះ" },
];
