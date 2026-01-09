import { Alignment } from '@/types'

// Gesinnungsquadrat aus der Spielleiter-Infos Datei
export const alignments: Alignment[][] = [
  [
    {
      name: 'Rechtschaffen Gut Lawful Good',
      description: 'Ein rechtschaffen guter Charakter handelt so, wie es von einer guten Person erwartet wird oder wie es von ihm verlangt wird. In ihm verbindet sich das Bedürfnis, das Böse zu bekämpfen, mit der Disziplin, unermüdlich den Kampf fort zu führen. Er spricht die Wahrheit, hält sein Wort, hilft den Bedürftigen und spricht sich gegen Ungerechtigkeit aus. Ein rechtschaffen guter Charakter hasst es, Schuldige ungestraft davonkommen zu lassen. Rechtschaffen gut vereint Ehre und Mitgefühl.',
      row: 0,
      col: 0,
    },
    {
      name: 'Neutral (Wahrhaft) Gut Neutral (True) Good',
      description: 'Ein neutral guter Charakter tut das Beste, was eine gute Person tun kann. Er versucht ständig anderen zu helfen. Er arbeitet mit Königen und Magistraten zusammen, aber fühlt sich ihnen gegenüber nicht verpflichtet.',
      row: 0,
      col: 1,
    },
    {
      name: 'Chaotisch Gut Chaotic Good',
      description: 'Ein chaotisch guter Charakter tut, was er für richtig hält, und misstraut Autorität. Er handelt nach seinem Gewissen, ohne sich um die Erwartungen anderer zu kümmern.',
      row: 0,
      col: 2,
    },
  ],
  [
    {
      name: '(Wahrhaft) Rechtschaffen Neutral (True) Lawful Neutral',
      description: 'Ein rechtschaffen neutraler Charakter handelt nach Gesetz, Tradition oder persönlichem Kodex. Ordnung und Organisation sind wichtig. Er glaubt an persönliche Verantwortung und dass Individuen eine Rolle in einer geordneten Gesellschaft haben.',
      row: 1,
      col: 0,
    },
    {
      name: '-Neutral-',
      description: 'Ein neutraler Charakter tut das, was er für eine gute Idee erachtet. Er fühlt sich zu keiner Seite besonders hingezogen, sei es in Bezug auf Gut und Böse bzw. auf Ordnung (Rechtschaffenheit) und Chaos, weshalb Neutral mitunter auch „Rein Neutral" genannt wird. Die meisten neutralen Charaktere zeigen eher einen Mangel an Urteilsmaß oder Meinung, als dass sie sich für die Neutralität stark machen.',
      row: 1,
      col: 1,
    },
    {
      name: '(Wahrhaft) Chaotisch Neutral (True) Chaotic Neutral',
      description: 'Ein chaotisch neutraler Charakter folgt seinen Launen. Es ist in erster Linie ein Individualist. Er schätzt seine eigene Freiheit, setzt sich aber nicht für die Freiheit anderer ein. Er meidet die Obrigkeit, lehnt Einschränkungen ab und stellt Traditionen in Frage.',
      row: 1,
      col: 2,
    },
  ],
  [
    {
      name: 'Rechtschaffen Böse Lawful Evil',
      description: 'Ein rechtschaffen böser Charakter methodisch nimmt, was er will, innerhalb der Grenzen seines Kodex der Tradition, Loyalität oder Ordnung. Er kümmert sich um Tradition, Loyalität und Ordnung, aber nicht um Freiheit, Würde oder Leben.',
      row: 2,
      col: 0,
    },
    {
      name: 'Neutral (Wahrhaft) Böse Neutral (True) Evil',
      description: 'Ein neutral böser Charakter tut, was er kann, um das zu bekommen, was er will, ohne Rücksicht auf andere. Er hat keine Skrupel, andere zu verletzen, tut dies aber nicht aus Freude am Leid anderer.',
      row: 2,
      col: 1,
    },
    {
      name: 'Chaotisch Böse Chaotic Evil',
      description: 'Ein chaotisch böser Charakter tut, was seine Gier, Hass oder Zerstörungswut ihm eingibt. Er ist bösartig, zufällig gewalttätig und unberechenbar.',
      row: 2,
      col: 2,
    },
  ],
]

export function getAlignment(row: number, col: number): Alignment | undefined {
  if (row >= 0 && row < alignments.length && col >= 0 && col < alignments[row].length) {
    return alignments[row][col]
  }
  return undefined
}

