import React from 'react';
import NFTCard, { NFTItem } from './NFTCard';
import { Skeleton } from './ui/skeleton';

interface NFTGridProps {
  items: NFTItem[];
  isLoading?: boolean;
  onBuy?: (listingId: number, price: string) => Promise<void>;
  onCancel?: (listingId: number) => Promise<void>;
  onBid?: (auctionId: number, amount: string) => Promise<void>;
  userAccount?: string | null;
}

const NFTGrid: React.FC<NFTGridProps> = ({ items, isLoading, onBuy, onCancel, onBid, userAccount }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-6">
            <Skeleton className="aspect-square w-full rounded-[2.5rem]" />
            <div className="space-y-3 px-4">
              <Skeleton className="h-8 w-3/4 rounded-xl" />
              <Skeleton className="h-5 w-1/2 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="h-32 w-32 rounded-full bg-primary/5 flex items-center justify-center animate-bounce-subtle">
          <span className="text-6xl">🕳️</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-black tracking-tight">No NFTs found</h3>
          <p className="text-muted-foreground text-lg font-medium">Try adjusting your filters or search query.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
      {items.map((item) => (
        <NFTCard
          key={item.isAuction ? `auction-${item.auctionId}-${item.tokenId}` : `listing-${item.listingId}-${item.tokenId}`}
          item={item}
          onBuy={onBuy}
          onCancel={onCancel}
          onBid={onBid}
          isOwner={userAccount?.toLowerCase() === item.seller?.toLowerCase() || userAccount?.toLowerCase() === item.owner?.toLowerCase()}
        />
      ))}
    </div>
  );
};

export default NFTGrid;
