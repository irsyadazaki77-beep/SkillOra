export const getCourseTemplates = (courseId: string) => {
  switch (courseId) {
    case "react-tokopedia":
      return [
        {
          id: "b_prod",
          name: "Products Grid Layout (Tokopedia Style)",
          code: `<div class="bg-slate-50 p-4 rounded-lg border-2 border-slate-200 font-sans">
  <header class="mb-4 flex justify-between items-center">
    <h3 class="text-base font-bold text-slate-800">Tokopedia Mini Mock - Elektronik</h3>
    <span class="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">🟢 Open Toko</span>
  </header>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
    <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
      <div class="h-20 bg-emerald-50 rounded-lg flex items-center justify-center text-xl">📱</div>
      <h4 class="font-bold text-xs mt-3 text-slate-800">Samsung Galaxy S26 Ultra</h4>
      <p class="text-emerald-600 font-extrabold text-xs mt-1">Rp 18.500.000</p>
    </div>
  </div>
</div>`
        }
      ];
    default:
      return [
        {
          id: "default_tmpl",
          name: "Boilerplate Proyek Sertifikasi Standard",
          code: `// Boilerplate Proyek Industri Skillora
function main() {
  console.log("Proyek Sertifikasi Terhubung ke Platform Skillora");
}
main();`
        }
      ];
  }
};
