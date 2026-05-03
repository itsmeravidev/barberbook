export default function Logo() {
  return (
    <div className="flex flex-col leading-none select-none">
      <span
        className="font-black text-[#1c1c1c] tracking-tight leading-none"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px' }}
      >
        BarberBook
      </span>
      <span
        className="leading-none mt-0.5"
        style={{
          fontFamily: "'Dancing Script', cursive",
          fontSize:   '15px',
          color:      '#6b8596',
          fontWeight: 700,
        }}
      >
        By Samir
      </span>
    </div>
  )
}
