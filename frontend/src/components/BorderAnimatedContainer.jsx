// How to make animated gradient border 👇
// https://cruip-tutorials.vercel.app/animated-gradient-border/
function BorderAnimatedContainer({ children }) {
  return (
    <div className="w-full h-full [background:linear-gradient(45deg,#0d0e12,#1e1f23_50%,#0d0e12)_padding-box,conic-gradient(from_var(--border-angle),#414755_80%,_#4b8eff_86%,_#adc6ff_90%,_#4b8eff_94%,_#414755)_border-box] rounded-2xl border border-transparent animate-border flex overflow-hidden relative">
      {children}
    </div>
  );
}
export default BorderAnimatedContainer;
