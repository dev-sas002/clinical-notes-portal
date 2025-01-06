import Link from "next/link"
import { Card, CardBody, CardHeader } from "../src/ui/Card"

export default function NotFound() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader title="Page not found" />
      <CardBody>
        <p className="text-sm text-ink-600">
          That page does not exist.{" "}
          <Link href="/" className="font-medium text-brand-700 underline">
            Back to care notes
          </Link>
          .
        </p>
      </CardBody>
    </Card>
  )
}
