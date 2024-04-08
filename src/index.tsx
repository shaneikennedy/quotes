import React, { useEffect, useState } from "react";
import yahooFinance from "yahoo-finance2";
import { Quote } from "yahoo-finance2/dist/esm/src/modules/quote";
import { Ticker, tickers } from "./tickers";

import { ActionPanel, Action, Detail, List } from "@raycast/api";

export default function Command() {
  const [quickQuote, setQuickQuote] = useState<Quote | null>();
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

  return (
    <List
      onSelectionChange={handleNewSelection}
      navigationTitle="Search for quotes"
      searchBarPlaceholder="Search for quotes"
    >
      {tickers.map((t: Ticker, index) => (
        <List.Item
          id={t.symbol}
          key={index}
          title={getListItemTitle(t)}
          actions={
            <ActionPanel title="Quote menu">
              <Action.Push icon={"📈"} title="Get Quote" target={<QuoteView symbol={t.symbol} />} />
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
  symbol: string;
};

const QuoteView: React.FC<QuoteViewProps> = ({ symbol }) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  useEffect(() => {
    async function fetchQuote() {
      const q = await yahooFinance.quote(symbol);
      if (q.symbol != quote?.symbol) {
        setQuote(q);
      }
    }
    fetchQuote();
  }, [quote]);

  return (
    <>
      {quote ? (
        <Detail markdown={`# ${symbol.toUpperCase()} ${quote.regularMarketPrice}`} />
      ) : (
        <Detail markdown="Fetching quote..." />
      )}
    </>
  );
};
