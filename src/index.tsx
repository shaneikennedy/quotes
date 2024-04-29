import React, { useEffect, useState } from "react";
import yahooFinance from "yahoo-finance2";
import { Quote } from "yahoo-finance2/dist/esm/src/modules/quote";
import { Ticker, tickers as ticks } from "./tickers";

import { ActionPanel, Action, Icon, Detail, List, Color } from "@raycast/api";
import { addFavoriteToStorage, loadFavorites, removeFavoriteFromStorage } from "./storage";

export default function Command() {
  const [quickQuote, setQuickQuote] = useState<Quote | null>();
  const [tickers, setTickers] = useState<Array<Ticker>>(ticks);
  const handleNewSelection = async (symbol: string | null) => {
    if (symbol === null) {
      return;
    } else if (tickers.findIndex((ticker) => ticker.symbol === symbol) >= 0) {
      const q = await yahooFinance.quote(symbol);
      setQuickQuote(q);
    }
  };

  function getListItemTitle(t: Ticker) {
    let title = `${t.symbol} ${t.name}`;
    if (t.symbol === quickQuote?.symbol) {
      title += ` ${quickQuote ? quickQuote?.regularMarketPrice : ""}`;
      title += ` ${quickQuote ? "(" + quickQuote.regularMarketChangePercent?.toPrecision(3) + "%)" : ""}`;
    }
    return title;
  }

  async function updateTickers() {
    const favorites: Array<string> = await loadFavorites();
    setTickers(
      tickers
        .map((t: Ticker) => (favorites.includes(t.symbol) ? { ...t, favorited: true } : { ...t, favorited: false }))
        .toSorted((t1, t2) => (t1.favorited === t2.favorited ? 0 : t1.favorited ? -1 : 1)),
    );
  }

  async function addToFavorites(t: Ticker) {
    await addFavoriteToStorage(t.symbol);
    updateTickers();
  }

  async function removeFromFavorites(t: Ticker) {
    await removeFavoriteFromStorage(t.symbol);
    updateTickers();
  }

  useEffect(() => {
    updateTickers();
  }, []);

  return (
    <List
      onSelectionChange={handleNewSelection}
      navigationTitle="Search for quotes"
      searchBarPlaceholder="Search for quotes"
    >
      {tickers.map((t: Ticker) => (
        <List.Item
          id={t.symbol}
          key={t.symbol}
          title={getListItemTitle(t)}
          accessories={t.favorited ? [{ icon: Icon.StarCircle }] : []}
          actions={
            <ActionPanel title="Quote menu">
              <Action.Push
                icon={"📈"}
                title="Get Quote"
                target={
                  <QuoteView ticker={t} addToFavorites={addToFavorites} removeFromFavorites={removeFromFavorites} />
                }
              />
              <Action.OpenInBrowser
                title="See on finance.yahoo.com"
                url={`https://finance.yahoo.com/quote/${t.symbol}`}
              />
              {!t.favorited && (
                <Action title="Save to favorites" icon={Icon.StarCircle} onAction={() => addToFavorites(t)} />
              )}
              {t.favorited && (
                <Action title="Remove from favorites" icon={Icon.Star} onAction={() => removeFromFavorites(t)} />
              )}
              <Action.OpenInBrowser
                title="See on finance.yahoo.com"
                url={`https://finance.yahoo.com/quote/${t.symbol}`}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

type QuoteViewProps = {
  ticker: Ticker;
  addToFavorites: (t: Ticker) => Promise<void>;
  removeFromFavorites: (t: Ticker) => Promise<void>;
};

const QuoteView: React.FC<QuoteViewProps> = ({ ticker, addToFavorites, removeFromFavorites }) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isFav, setIsFav] = useState<boolean>(ticker.favorited);
  useEffect(() => {
    async function fetchQuote() {
      const q = await yahooFinance.quote(ticker.symbol);
      if (q.symbol != quote?.symbol) {
        setQuote(q);
      }
    }
    fetchQuote();
  }, [quote]);

  const markdown = (quote: Quote) => `
  # ${quote.symbol.toUpperCase()} ${quote.regularMarketPrice}
  #### ${new Date().toDateString()}
  ### ${quote.longName} (${quote.fullExchangeName})
  `;
  return (
    <>
      {quote ? (
        <Detail
          markdown={markdown(quote)}
          navigationTitle={`${quote.symbol}`}
          actions={
            <ActionPanel title="Quote menu">
              <Action.OpenInBrowser
                title="See on finance.yahoo.com"
                url={`https://finance.yahoo.com/quote/${quote.symbol}`}
              />
              {!isFav && (
                <Action
                  title="Save to favorites"
                  icon={Icon.StarCircle}
                  onAction={() => {
                    addToFavorites(ticker);
                    setIsFav(true);
                  }}
                />
              )}
              {isFav && (
                <Action
                  title="Remove from favorites"
                  icon={Icon.Star}
                  onAction={() => {
                    removeFromFavorites(ticker);
                    setIsFav(false);
                  }}
                />
              )}
            </ActionPanel>
          }
          metadata={
            <Detail.Metadata>
              <Detail.Metadata.Label
                title="Today's change"
                text={{
                  value: `${quote.regularMarketChangePercent?.toPrecision(4)}%`,
                  color: quote.regularMarketChangePercent! > 0 ? Color.Green : Color.Red,
                }}
              />
              {isFav && <Detail.Metadata.Label title="In your favorites" text={"⭐"} />}
              <Detail.Metadata.Label title="Market cap" text={`$${quote.marketCap?.toLocaleString("en-US")}`} />
              <Detail.Metadata.Label title="Previous close" text={`${quote.regularMarketPreviousClose}`} />
              <Detail.Metadata.Label title="Open" text={`${quote.regularMarketOpen}`} />
              <Detail.Metadata.Label title="Earnings date" text={`${quote.earningsTimestamp?.toLocaleDateString()}`} />
              <Detail.Metadata.Separator />
              <Detail.Metadata.Link
                text={`${quote.symbol}`}
                target={`https://finance.yahoo.com/quote/${quote.symbol}`}
                title="Open in yahoo finance"
              />
            </Detail.Metadata>
          }
        />
      ) : (
        <Detail markdown="Fetching quote..." />
      )}
    </>
  );
};
