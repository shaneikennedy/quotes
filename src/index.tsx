import React, { useEffect, useState } from "react";
import yahooFinance from "yahoo-finance2";
import { Quote } from "yahoo-finance2/dist/esm/src/modules/quote";
import { Ticker, tickers as ticks } from "./tickers";

import { ActionPanel, Action, showToast, Toast, Icon, Detail, List, Color } from "@raycast/api";
import { addFavoriteToStorage, loadFavorites, removeFavoriteFromStorage } from "./storage";

export default function Command() {
  const [quickQuote, setQuickQuote] = useState<Quote | null>();
  const [tickers, setTickers] = useState<Array<Ticker>>(ticks);
  const handleNewSelection = async (symbol: string | null) => {
    if (symbol === null) {
      return;
    } else if (tickers.findIndex((ticker) => ticker.symbol === symbol) >= 0) {
      let q: Quote;
      try {
        q = await yahooFinance.quote(symbol);
        setQuickQuote(q);
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Something went wrong",
          message: "Trouble fetching quote data from yahoo finance.",
        });
      }
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

  async function addToFavorites(symbol: string) {
    await addFavoriteToStorage(symbol);
    updateTickers();
  }

  async function removeFromFavorites(symbol: string) {
    await removeFavoriteFromStorage(symbol);
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
            <ListViewActions ticker={t} addToFavorites={addToFavorites} removeFromFavorites={removeFromFavorites} />
          }
        />
      ))}
    </List>
  );
}

type ListViewActionsProps = {
  addToFavorites: (symbol: string) => Promise<void>;
  removeFromFavorites: (symbol: string) => Promise<void>;
  ticker: Ticker;
};

const ListViewActions: React.FC<ListViewActionsProps> = ({ ticker, addToFavorites, removeFromFavorites }) => {
  return (
    <ActionPanel title="Quote menu">
      <Action.Push
        icon={"📈"}
        title="Get Quote"
        target={
          <QuoteView
            ticker={ticker}
            addToFavorites={() => addToFavorites(ticker.symbol)}
            removeFromFavorites={() => removeFromFavorites(ticker.symbol)}
          />
        }
      />
      <Action.OpenInBrowser title="See on finance.yahoo.com" url={`https://finance.yahoo.com/quote/${ticker.symbol}`} />
      {!ticker.favorited && (
        <Action title="Save to favorites" icon={Icon.StarCircle} onAction={() => addToFavorites(ticker.symbol)} />
      )}
      {ticker.favorited && (
        <Action title="Remove from favorites" icon={Icon.Star} onAction={() => removeFromFavorites(ticker.symbol)} />
      )}
      <Action.OpenInBrowser title="See on finance.yahoo.com" url={`https://finance.yahoo.com/quote/${ticker.symbol}`} />
    </ActionPanel>
  );
};

type QuoteViewProps = {
  ticker: Ticker;
  addToFavorites: (symbol: string) => Promise<void>;
  removeFromFavorites: (symbol: string) => Promise<void>;
};

const QuoteView: React.FC<QuoteViewProps> = ({ ticker, addToFavorites, removeFromFavorites }) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isFav, setIsFav] = useState<boolean>(ticker.favorited);
  useEffect(() => {
    async function fetchQuote() {
      try {
        const q = await yahooFinance.quote(ticker.symbol);
        if (q.symbol != quote?.symbol) {
          setQuote(q);
        }
      } catch (e) {
        showToast({
          style: Toast.Style.Failure,
          title: "Something went wrong",
          message: "Trouble fetching quote data from yahoo finance.",
        });
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
            <QuoteViewActions
              quote={quote}
              isFav={isFav}
              setIsFav={setIsFav}
              addToFavorites={addToFavorites}
              removeFromFavorites={removeFromFavorites}
            />
          }
          metadata={<QuoteViewMetadata quote={quote} isFav={isFav} />}
        />
      ) : (
        <Detail markdown="Fetching quote..." />
      )}
    </>
  );
};

type QuoteViewActionsProps = {
  quote: Quote;
  isFav: boolean;
  setIsFav: React.Dispatch<React.SetStateAction<boolean>>;
  addToFavorites: (symbol: string) => Promise<void>;
  removeFromFavorites: (symbol: string) => Promise<void>;
};
const QuoteViewActions: React.FC<QuoteViewActionsProps> = ({
  quote,
  isFav,
  setIsFav,
  addToFavorites,
  removeFromFavorites,
}) => {
  return (
    <ActionPanel title="Quote menu">
      <Action.OpenInBrowser title="See on finance.yahoo.com" url={`https://finance.yahoo.com/quote/${quote.symbol}`} />
      {!isFav && (
        <Action
          title="Save to favorites"
          icon={Icon.StarCircle}
          onAction={() => {
            addToFavorites(quote.symbol);
            setIsFav(true);
          }}
        />
      )}
      {isFav && (
        <Action
          title="Remove from favorites"
          icon={Icon.Star}
          onAction={() => {
            removeFromFavorites(quote.symbol);
            setIsFav(false);
          }}
        />
      )}
    </ActionPanel>
  );
};

type QuoteViewMetadateProps = {
  quote: Quote;
  isFav: boolean;
};
const QuoteViewMetadata: React.FC<QuoteViewMetadateProps> = ({ quote, isFav }) => {
  return (
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
  );
};
