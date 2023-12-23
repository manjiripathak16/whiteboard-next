import Image from "next/image";
import Whiteboard from "@/components/whiteboard";

export default function Home() {
  return (
    <div>
      <h1>Whiteboard</h1>
      <Whiteboard width={800} height={600} />
    </div>
  );
}
