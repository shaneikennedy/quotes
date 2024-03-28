import React, { useEffect, useState } from "react";
import yahooFinance from "yahoo-finance2";
import { Quote } from "yahoo-finance2/dist/esm/src/modules/quote";
import { tickers } from "./tickers";

import { ActionPanel, Form, Action, Detail, useNavigation, List } from "@raycast/api";

export default function Command() {
  return (
    <List navigationTitle="Search for quotes" searchBarPlaceholder="Search for quotes">
      {tickers.map((t) => (
        <List.Item
          key={t.symbol}
          title={`${t.symbol} ${t.name}`}
          actions={
            <ActionPanel title="#1 in raycast/extensions">
              <Action.Push title="Get Quote" target={<QuoteView symbol={t.symbol} />} />
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

export function QuoteForm() {
  const { push } = useNavigation();
  const [symbol, setSymbol] = useState("NVDA");

  return (
    <>
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm title="Get Quote" onSubmit={() => push(<QuoteView symbol={symbol} />)} />
          </ActionPanel>
        }
      >
        <Form.TextField id="symbol" value={symbol} onChange={setSymbol} />
      </Form>
    </>
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
        console.log(q);
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
