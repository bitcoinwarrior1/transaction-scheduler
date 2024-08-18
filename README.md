# transaction-scheduler
Schedule Bitcoin transactions by leveraging `nLockTime`. 

## Use cases
- Dead man's switch
- Scheduled payments
- Using different fees for the same transaction, to be executed at different times e.g. try with a low fee immediately, try with a higher a bit later, etc.
- Allowances to a dependent, bound by time 

## API
`POST /schedule/tx`

Body:

```json
{
  "rawTx": "Raw tx bytes"
}
```