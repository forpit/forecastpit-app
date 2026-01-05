# Known Bugs

## 1. Reasoning shows wrong market

**Status:** FIXED ✅

**Problem:**
Na stronie Activity i ModelDetail reasoning wyświetla się dla złego marketu. Np. trade na "Will Ethereum hit $17,000 by December 31?" pokazuje reasoning o "Portugal presidential election".

**Lokalizacja bugu:**
- `src/pages/ActivityPage.tsx` linia ~165
- `src/pages/ModelDetailPage.tsx` linia ~239
- `src/components/Hero.tsx` linia ~114

**ROOT CAUSE:**

Query nie zawiera `market_id` w select, więc `t.market_id` jest `undefined`:

```javascript
// ModelDetailPage.tsx - BRAKUJE market_id w select!
const { data: trades } = await supabase
  .from("trades")
  .select(`
    id, side, shares, price, total_amount, executed_at,
    markets(question, slug),
    decisions(parsed_response)
  `)  // ← market_id NIE MA!

// Potem próbuje matchować:
const bet = decision.parsed_response.bets.find(
  (b: any) => b.market_id === t.market_id  // ← t.market_id = undefined!
);
```

**Hero.tsx** ma podobny problem - używa `t.markets?.id` zamiast `t.market_id`, ale `id` nie jest w select.

**POTWIERDZONE:** Dane w bazie są poprawne - `parsed_response.bets[].market_id` to UUID który matchuje `trades.market_id`.

**FIX:**
1. `ModelDetailPage.tsx` linia ~163: dodać `market_id` do select
2. `Hero.tsx` linia ~91: dodać `market_id` do select i użyć `t.market_id` zamiast `t.markets?.id`

---

## 2. Mistral Large 3 losses

**Status:** NOT A BUG - Model ignoruje instrukcje

**Problem:**
Mistral Large 3 ma największe straty.

**WYNIKI ŚLEDZTWA:**

### Pozycje Mistrala z największymi stratami:

| Market | Side | Entry Price | Current | P&L |
|--------|------|-------------|---------|-----|
| ETH $17k by Dec 31 | YES | 0.1% | 0.05% | **-$250** |
| NVIDIA largest company | NO | 0.6% | 99.7% | **-$250** |
| Minecraft top movie 2025 | NO | 0.35% | 99.7% | **-$71** |

### Zyskowne pozycje:
| Market | Side | Entry Price | Current | P&L |
|--------|------|-------------|---------|-----|
| Lighter FDV >$1B | YES | 66.5% | 99.5% | **+$248** |
| Venezuela engagement | NO | 87.1% | 96.4% | **+$53** |

### ROOT CAUSE - Strategia Mistrala:

Mistral stosuje **strategię kontrariańską** - zakłada się przeciwko niemal pewnym wydarzeniom licząc na "black swan":

1. **ETH YES** przy 0.1% - zakład że ETH osiągnie $17k (niemożliwe przy $3,400)
2. **NVIDIA NO** przy 0.6% - zakład że NVIDIA nie będzie #1 (jest #1)
3. **Minecraft NO** - zakład że nie będzie top movie (jest)

To klasyczna strategia "zbierania groszy przed walcem parowym" (picking up pennies in front of a steamroller) - małe zyski, ale katastrofalne straty gdy niemal pewne wydarzenie się spełnia.

**REASONING Z MODELU:**
> "The market price of 99.4% YES is extremely high, but there is still a small chance (0.6%) that another company could surpass NVIDIA. Given the low NO price, this is a high-risk, high-reward bet with a favorable risk-reward ratio."

Model błędnie ocenia risk-reward - "favorable ratio" jest fałszywy bo prawdopodobieństwo wygranej jest ekstremalnie niskie.

### KONKLUZJA:

**Prompt zawiera jasne instrukcje:**
```
BE REALISTIC about time horizons:
- If market says 0.1% YES, the market is RIGHT - don't bet YES
- Don't bet NO on something that's already true
```

**Mistral wiedział:**
- Data: 2025-12-29
- NVIDIA closes: 2025-12-31 (2 days left)
- Price: 99.4% YES

**I MIMO TO postawił NO.**

To nie jest bug - Mistral po prostu ignoruje instrukcje. Claude (0 głupich zakładów) i Llama najlepiej przestrzegają zasad.

---

## 3. SELL trades wyświetlają @ 0%

**Status:** FIXED ✅

**Problem:**
Na stronie Activity niektóre trade'y wyświetlają się z ceną @ 0% co wygląda jakby modele obstawiały coś niemożliwego.

**Screenshot user:**
- Mistral: "NVIDIA... @ 0%" - użytkownik myślał że model obstawił coś @ 0%

**ROOT CAUSE:**

SELL trades mają bardzo niską cenę wyprzedaży (np. 0.0005) bo to jest cena za którą sprzedają pozycję, NIE cena rynkowa. Dodatkowo:
- `decision_id = null` dla SELL trades
- Brak `trade_type` w UI - użytkownik nie widzi czy to BUY czy SELL

**Dane z bazy:**
```json
{
  "trade_type": "SELL",
  "price": 0.0005,  // ← cena wyprzedaży, nie cena rynkowa!
  "decision_id": null
}
```

**FIX w `ActivityPage.tsx`:**

1. Dodano badge BUY (niebieski) / SELL (pomarańczowy)
2. Dodano kolumnę "Type" w nagłówku tabeli
3. Dla SELL trades bez decision: domyślny reasoning "LLM decided to close position"
4. Dodano `position_id` do query dla matchowania sells z decisions

**KOD:**
```tsx
// Badge BUY/SELL
<Badge
  className={trade.trade_type === "BUY"
    ? "border-blue-500 text-blue-500 bg-blue-500/10"
    : "border-orange-500 text-orange-500 bg-orange-500/10"}
>
  {trade.trade_type}
</Badge>

// Reasoning dla SELL
if (t.trade_type === "SELL") {
  reasoning = sell?.reasoning || "LLM decided to close position";
}
```

---

## 4. "Duplikaty" rynków NVIDIA

**Status:** NOT A BUG

**Problem:**
Użytkownik zauważył że Mistral i Gemini obstawiają "ten sam" market NVIDIA ale w różnych miejscach.

**WYNIKI ŚLEDZTWA:**

To są **DWA RÓŻNE RYNKI** o podobnej nazwie:
1. "Will NVIDIA be the largest company... **December 31, 2024**"
2. "Will NVIDIA be the largest company... **January 31, 2025**"

**KONKLUZJA:**
Polymarket ma wiele rynków o podobnych pytaniach ale różnych datach. To nie jest duplikat ani błąd - to osobne rynki z różnymi terminami.

---

## Summary

| Bug | Status | Severity | Fix Effort |
|-----|--------|----------|------------|
| #1 Reasoning mismatch | **FIXED** | Medium | Easy - dodano market_id do select |
| #2 Mistral losses | **NOT A BUG** | Info | Model ignoruje instrukcje - wynik eksperymentu |
| #3 SELL trades @ 0% | **FIXED** | High | Easy - dodano badge BUY/SELL + reasoning |
| #4 NVIDIA "duplikaty" | **NOT A BUG** | Info | Różne rynki z różnymi datami |
