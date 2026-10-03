import { Card } from "@/shared/components/atoms/Card/Card";
import { ProductCard } from "@/shared/components/organisms/ProductCard/ProductCard";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import samplePhoto from "../../assets/sample-photo.png";
import { devComponentsContent } from "../../content/devComponents";
import type { SampleDates } from "../../lib/sampleData";
import { ProductCardDemo, ProductCardDetailsDemo } from "../demos/ProductCardDemos";
import { Demo, PreviewSection } from "../PreviewSection";

const content = devComponentsContent;
const copy = content.productCard;

export interface ProductCardSectionProps {
  dates: SampleDates;
}

export function ProductCardSection({ dates }: ProductCardSectionProps) {
  return (
    <PreviewSection id="product-card" title={content.sections.productCard}>
      <Demo caption={content.captions.card} stack>
        <Card className="flex flex-col">
          <span className="caption text-ink-muted">{copy.cardTitle}</span>
          <span className="product-name">{copy.cardBody}</span>
        </Card>
      </Demo>
      <Demo caption={content.captions.productGrid} stack>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 admin:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
          <ProductCardDemo product="rye" />
          <ProductCardDemo product="bagel" initialQuantity={2} />
          <ProductCard
            {...copy.products.seeded}
            soldOut={copy.soldOutFor(formatPickupDay(dates.soldOutDay))}
          />
          <ProductCard {...copy.products.croissant} soldOut />
          <ProductCardDemo product="scroll" image={samplePhoto} imageAlt={copy.imageAlt} />
        </div>
      </Demo>
      <Demo caption={content.captions.stackedFooter} stack>
        <div className="grid grid-cols-2 gap-3 admin:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
          <ProductCardDemo product="rye" footer="stacked" />
          <ProductCardDemo product="bagel" initialQuantity={2} footer="stacked" />
          <ProductCard
            {...copy.products.seeded}
            footer="stacked"
            soldOut={copy.soldOutFor(formatPickupDay(dates.soldOutDay))}
          />
        </div>
      </Demo>
      <Demo caption={content.captions.withDetails} stack>
        <div className="grid max-w-80 grid-cols-1 gap-3">
          <ProductCardDetailsDemo product="rye" />
        </div>
      </Demo>
      <Demo caption={content.captions.rowLayout} stack>
        <ProductCardDemo product="rye" initialQuantity={1} layout="row" />
        <ProductCardDemo
          product="scroll"
          layout="row"
          image={samplePhoto}
          imageAlt={copy.imageAlt}
        />
      </Demo>
    </PreviewSection>
  );
}
