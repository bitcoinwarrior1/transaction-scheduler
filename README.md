# transaction-scheduler

Schedule future Bitcoin transactions by leveraging `nLockTime`.

## Use cases

### Dead man's switch

A user could sign a transaction with a `timelock` that sends their cold storage funds to a trusted third party if they lose access to their keys. If the user retains access to their keys, they can spend the inputs and invalidate the `timelocked` transaction. These transactions should be RBF and multiple transactions should be created with different fees if the acceptable fees change drastically. If unsuccessful, this service can broadcast the transaction again at a future date if it drops out of the `mempool`. Users can also specify that they only want to broadcast the transaction if it has an acceptable fee set, and the service will only broadcast the transaction if the fee is appropriate.

### Scheduled payments

Let's say you want to schedule payments to a service provider or a dependant. You could sign transactions with a future date as the `timelock` and send them to this service. The transaction would then be broadcast at a future date.

### Fees

The network fees may be high, and you have a non-urgent payment to make. You could sign a transaction or multiple transactions with different `timelocks` to be attempted. These transactions can be `RBF` enabled, allowing you to replace old transaction(s) stuck in the `mempool`. This could look like the following:

1. Sign five `RBF` transactions with different `timelocks`, in ascending order from the lowest fee to the highest fee
2. If the first transaction is still in the mempool at the time of the second `timelock`, broadcast the second one to replace the first
3. Hopefully, one of the `timelocked` transactions ends up in the `mempool`.

Users can also specify that they only want to broadcast the transaction if it has an acceptable fee set, and the service will only broadcast the transaction if the fee is appropriate.

### Automatically resetting 2FA multisig CSV transactions

Blockstream green supports 2FA multisig, a service that requires you provide a valid 2FA code for blockstream to co-sign your transactions. Blockstream green uses CSV transactions that enable you to spend the funds with your single key after a certain time has been reached. This is useful for those who have lost their 2FA method, or in the event that blockstream's server goes down.

Users of this feature need to ensure that they send new transactions to reset the `timelock`. Failure to do so will mean that the security of their funds will revert to a single sig wallet.

Users of the blockstream green service can have their `CSV` reset automatically by signing a transaction with a future `timelock`, and posting it to this service. This service will then broadcast their new transaction, enabling them to reset their `timelock` without having to go back to their wallet.

Users can add a grace period to this `timelock`, enabling them to spend their funds once the original `CSV` becomes valid, and before the future transaction is set to become valid.

## API

`POST /schedule/tx`

Body:

```json
{
  "rawTx": "YOUR_RAW_SIGNED_TRANSACTION_IN_HEX",
  "checkFee": "boolean"
}
```

Params:

`rawTx`: your raw transaction bytes as hex.
`checkFee`: set to `true` if you want to prevent broadcasting a transaction if it has a fee that is lower than the recommendation, otherwise `false`.

Successful output:

```json
{
  "body": true,
  "status": 200
}
```
