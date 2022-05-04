# Pixelland substrate

## Lottery pick


gõ tiếng việt

```rs
pub struct LotteryPick<T: Config> {
  pub pixel: u32;
  pub time: u32;
  pub account: AccountOf<T>;
}

#[pallet::storage]
#[pallet::getter(fn kitties_owned)]
/// Keeps track of what accounts own what Kitty.
pub(super) type UserPicks<T: Config> =
	StorageMap<_, Twox64Concat, T::AccountId, BoundedVec<LotteryPick<T>, 100>, ValueQuery>;
```
