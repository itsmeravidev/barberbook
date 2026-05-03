import samirLogo from '../images/samirLogo.png'

export default function Logo() {
  return (
    <img
      src={samirLogo}
      alt="BarberBook by Samir"
      className="h-20 w-auto object-contain select-none"
      style={{ background: 'transparent', mixBlendMode: 'multiply' }}
      draggable={false}
    />
  )
}
