export default function LemmaHints({
  data, lemma
}: {
  data: string[];
  lemma: string;
}) {
  return (
    <div>
      <p>{lemma}</p>
      {data.map((s, i) => (
        <p key={i}>{s}</p>
      ))}
    </div>
  );
}