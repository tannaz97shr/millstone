import { formatPhone } from "@/shared/utils/phone";

/** A sentence ending in the branch's phone as a tel: link, as on C7. */
export function OrderCall({ before, phone, after }: { before: string; phone: string; after: string }) {
  return (
    <>
      {before}
      <a
        href={`tel:${phone}`}
        className="font-bold whitespace-nowrap text-crust underline underline-offset-3 hover:text-crust-deep"
      >
        {formatPhone(phone)}
      </a>
      {after}
    </>
  );
}
