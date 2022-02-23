/*!
Non-Fungible Token implementation with JSON serialization.
NOTES:
  - The maximum balance value is limited by U128 (2**128 - 1).
  - JSON calls should pass U128 as a base-10 string. E.g. "100".
  - The contract optimizes the inner trie structure by hashing account IDs. It will prevent some
    abuse of deep tries. Shouldn't be an issue, once NEAR clients implement full hashing of keys.
  - The contract tracks the change in storage before and after the call. If the storage increases,
    the contract requires the caller of the contract to attach enough deposit to the function call
    to cover the storage cost.
    This is done to prevent a denial of service attack on the contract by taking all available storage.
    If the storage decreases, the contract will issue a refund for the cost of the released storage.
    The unused tokens from the attached deposit are also refunded, so it's safe to
    attach more deposit than required.
  - To prevent the deployed contract from being modified or deleted, it should not have any access
    keys on its account.
*/
use near_contract_standards::non_fungible_token::metadata::{
    NFTContractMetadata, NonFungibleTokenMetadataProvider, TokenMetadata, NFT_METADATA_SPEC,
};
use near_contract_standards::non_fungible_token::{Token, TokenId};
use near_contract_standards::non_fungible_token::NonFungibleToken;
use near_sdk::serde::{Serialize};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::LazyOption;
use near_sdk::collections::LookupMap;
// use near_sdk::json_types::AccountId;
use near_sdk::{
    env, near_bindgen, AccountId, Balance, BorshStorageKey, PanicOnDefault, Promise, PromiseOrValue,
};

mod utils;
use utils::*;

// use cast::{u128, Error};

// near_sdk::setup_alloc!();

// struct RecSize {
//     width: u8,
//     height: u8
// }

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct UncoveredToken {
    token_id: TokenId,
    width: u8,
    height: u8
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    tokens: NonFungibleToken,
    metadata: LazyOption<NFTContractMetadata>,
    mint_price: Balance,
    token_merge: LookupMap<TokenId, (u8, u8)>,
    token_merged: LookupMap<TokenId, TokenId>,
}

const DATA_IMAGE_SVG_NEAR_ICON: &str = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 288 288'%3E%3Cg id='l' data-name='l'%3E%3Cpath d='M187.58,79.81l-30.1,44.69a3.2,3.2,0,0,0,4.75,4.2L191.86,103a1.2,1.2,0,0,1,2,.91v80.46a1.2,1.2,0,0,1-2.12.77L102.18,77.93A15.35,15.35,0,0,0,90.47,72.5H87.34A15.34,15.34,0,0,0,72,87.84V201.16A15.34,15.34,0,0,0,87.34,216.5h0a15.35,15.35,0,0,0,13.08-7.31l30.1-44.69a3.2,3.2,0,0,0-4.75-4.2L96.14,186a1.2,1.2,0,0,1-2-.91V104.61a1.2,1.2,0,0,1,2.12-.77l89.55,107.23a15.35,15.35,0,0,0,11.71,5.43h3.13A15.34,15.34,0,0,0,216,201.16V87.84A15.34,15.34,0,0,0,200.66,72.5h0A15.35,15.35,0,0,0,187.58,79.81Z'/%3E%3C/g%3E%3C/svg%3E";

#[derive(BorshSerialize, BorshStorageKey)]
enum StorageKey {
    NonFungibleToken,
    Metadata,
    TokenMetadata,
    Enumeration,
    Approval,
    TokenMerge,
    TokenMerged,
}

#[near_bindgen]
impl Contract {
    /// Initializes the contract owned by `owner_id` with
    /// default metadata (for example purposes only).
    #[init]
    pub fn new_default_meta(owner_id: AccountId, mint_price: Balance) -> Self {
        Self::new(
            owner_id,
            mint_price,
            NFTContractMetadata {
                spec: NFT_METADATA_SPEC.to_string(),
                name: "Example NEAR non-fungible token".to_string(),
                symbol: "EXAMPLE".to_string(),
                icon: Some(DATA_IMAGE_SVG_NEAR_ICON.to_string()),
                base_uri: None,
                reference: None,
                reference_hash: None,
            },
        )
    }

    #[init]
    pub fn new(owner_id: AccountId, mint_price: Balance, metadata: NFTContractMetadata) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        metadata.assert_valid();
        Self {
            tokens: NonFungibleToken::new(
                StorageKey::NonFungibleToken,
                owner_id,
                Some(StorageKey::TokenMetadata),
                Some(StorageKey::Enumeration),
                Some(StorageKey::Approval),
            ),
            metadata: LazyOption::new(StorageKey::Metadata, Some(&metadata)),
            mint_price,
            token_merge: LookupMap::new(StorageKey::TokenMerge),
            token_merged: LookupMap::new(StorageKey::TokenMerged),
        }
    }

    /// Mint a new token with ID=`token_id` belonging to `receiver_id`.
    ///
    /// Since this example implements metadata, it also requires per-token metadata to be provided
    /// in this call. `self.tokens.mint` will also require it to be Some, since
    /// `StorageKey::TokenMetadata` was provided at initialization.
    ///
    /// `self.tokens.mint` will enforce `predecessor_account_id` to equal the `owner_id` given in
    /// initialization call to `new`.
    #[payable]
    pub fn nft_mint(
        &mut self,
        token_id: TokenId,
        receiver_id: AccountId,
        token_metadata: TokenMetadata,
    ) -> Token {
        assert!(env::attached_deposit() >= self.mint_price, "Not enough mint pay");
        self.tokens.internal_mint(token_id, receiver_id, Some(token_metadata))
    }

    #[payable]
    pub fn nft_batch_mint(&mut self, token_id: TokenId, width: u8, height: u8, receiver_id: AccountId, token_metadata: TokenMetadata) -> Vec<Token> {
        let cost: u128 = self.mint_price * (width as u128) * (height as u128);
        assert!(env::attached_deposit() >= cost, "Not enough batch mint pay");

        let mut tokens: Vec<Token> = Vec::new();

        // let closure = |sub_token_id| -> bool {
        //     let token = self.nft_mint(sub_token_id, receiver_id.clone(), token_metadata.clone());
        //     tokens.push(token);
        //     true
        // };

        // let mut sub_token_ids: Vec<TokenId> = Vec::new();

        iterate_token_area(token_id, width, height, |sub_token_id| -> bool {
            let token = self.nft_mint(sub_token_id, receiver_id.clone(), token_metadata.clone());
            tokens.push(token);
            // sub_token_ids.push(sub_token_id);
            true
        });

        // println!("sub_token_ids: {:?}", sub_token_ids);

        // for sub_token_id in sub_token_ids {
        //     self.nft_mint(sub_token_id.clone(), receiver_id.clone(), token_metadata.clone());
        //     println!("minted: {}", sub_token_id);
        // }

        // let (start_x, start_y) = get_coord(token_id);
        // for i in 0..(width as i128) {
        //     for j in 0..(height as i128) {
        //         let x = start_x + i;
        //         let y = start_y + j;
        //         let sub_token_id = get_token_id(x, y);
        //         let token = self.nft_mint(sub_token_id, receiver_id.clone(), token_metadata.clone());
        //         tokens.push(token);
        //     }
        // }

        tokens
    }

    pub fn nft_merge(&mut self, token_id: TokenId, width: u8, height: u8) {
        // let token = self.tokens.nft_token(token_id.clone()).unwrap_or_else(|| env::panic_str("Token not found"));
        // let owner = token.owner_id;
        // let owner_id = self.tokens.owner_by_id.get(&token_id).unwrap_or_else(|| env::panic_str("Token not found"));
        let owner_id = expect_token_found(self.tokens.owner_by_id.get(&token_id));
        assert_eq!(owner_id, env::predecessor_account_id(), "No permission to merge");

        let mut sub_token_ids: Vec<TokenId> = Vec::new();

        iterate_token_area(token_id.clone(), width, height, |sub_token_id| -> bool {
            if sub_token_id != token_id {
                let sub_owner_id = expect_token_found(self.tokens.owner_by_id.get(&sub_token_id));
                assert_eq!(sub_owner_id, owner_id, "No permission to merge");
                sub_token_ids.push(sub_token_id);
            }
            true
        });

        // let (start_x, start_y) = get_coord(token_id.clone());
        // for i in 0..(width as i128) {
        //     for j in 0..(height as i128) {
        //         if i == 0 && j == 0 { continue; }

        //         let x = start_x + i;
        //         let y = start_y + j;
        //         let sub_token_id = get_token_id(x, y);
        //         sub_token_ids.push(sub_token_id.clone());

        //         let sub_owner_id = expect_token_found(self.tokens.owner_by_id.get(&sub_token_id));
        //         assert_eq!(sub_owner_id, owner_id, "No permission to merge");
        //     }
        // }

        self.token_merge.insert(&token_id, &(width, height));
        for sub_token_id in &sub_token_ids {
            self.token_merged.insert(&sub_token_id, &token_id);
        }
    }

    pub fn get_token_with_size(&self, token_id: TokenId) -> UncoveredToken {
        let (width, height) = self.token_merge.get(&token_id).unwrap_or((1, 1));
        UncoveredToken {
            token_id,
            width,
            height
        }
    }

    pub fn get_not_covered_tokens(&self) -> Vec<UncoveredToken> {
        // let mut tokens: Vec<UncoveredToken> = Vec::new();

        self.tokens.owner_by_id
            .iter()
            .filter(|(token_id, _)| !self.is_covered_token((*token_id).clone()))
            .map(|(token_id, _)| self.get_token_with_size(token_id))
            // .skip(start_index as usize)
            // .take(limit)
            .collect()
    }

    fn is_covered_token(&self, token_id: TokenId) -> bool {
        match self.token_merged.get(&token_id) {
            Some(_) => true,
            None => false
        }
    }
}

near_contract_standards::impl_non_fungible_token_core!(Contract, tokens);
near_contract_standards::impl_non_fungible_token_approval!(Contract, tokens);
near_contract_standards::impl_non_fungible_token_enumeration!(Contract, tokens);

#[near_bindgen]
impl NonFungibleTokenMetadataProvider for Contract {
    fn nft_metadata(&self) -> NFTContractMetadata {
        self.metadata.get().unwrap()
    }
}

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
    use std::collections::HashMap;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    use super::*;

    const MINT_STORAGE_COST: u128 = 5_870_000_000_000_000_000_000;
    const ONE_NEAR_AMOUNT: u128 = 1_000_000_000_000_000_000_000_000;

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id);
        builder
    }

    fn sample_token_metadata() -> TokenMetadata {
        TokenMetadata {
            title: Some("Olympus Mons".into()),
            description: Some("The tallest mountain in the charted solar system".into()),
            media: None,
            media_hash: None,
            copies: Some(1u64),
            issued_at: None,
            expires_at: None,
            starts_at: None,
            updated_at: None,
            extra: None,
            reference: None,
            reference_hash: None,
        }
    }

    #[test]
    fn test_batch_mint() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(accounts(0).into(), 5 * ONE_NEAR_AMOUNT);

        // testing_env!(context
        //     .storage_usage(env::storage_usage())
        //     .attached_deposit((MINT_STORAGE_COST + 5 * ONE_NEAR_AMOUNT) * 10)
        //     .predecessor_account_id(accounts(0))
        //     .build());

        let sub_token_ids = ["7", "3", "10", "11", "12", "13", "14"];
        for token_id in sub_token_ids {
            testing_env!(context
                .storage_usage(env::storage_usage())
                .attached_deposit(MINT_STORAGE_COST + 5 * ONE_NEAR_AMOUNT)
                .predecessor_account_id(accounts(0))
                .build());
            contract.nft_mint(token_id.to_string(), accounts(0), sample_token_metadata());
        }

        // let token_id = "7".to_string();
        // let tokens = contract.nft_batch_mint(token_id.clone(), 3, 3, accounts(0), sample_token_metadata());
        // let token_0 = tokens[1].clone();
        // println!("tokens {} {}", token_0.token_id, token_0.owner_id);
    }

    #[test]
    fn test_new() {
        let mut context = get_context(accounts(1));
        testing_env!(context.build());
        let contract = Contract::new_default_meta(accounts(1).into(), 5000);
        testing_env!(context.is_view(true).build());
        assert_eq!(contract.nft_token("1".to_string()), None);
    }

    #[test]
    #[should_panic(expected = "The contract is not initialized")]
    fn test_default() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        let _contract = Contract::default();
    }

    #[test]
    fn test_mint() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(accounts(0).into(), 5000);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_STORAGE_COST)
            .predecessor_account_id(accounts(0))
            .build());

        let token_id = "0".to_string();
        let token = contract.nft_mint(token_id.clone(), accounts(0), sample_token_metadata());
        assert_eq!(token.token_id, token_id);
        assert_eq!(token.owner_id, accounts(0));
        assert_eq!(token.metadata.unwrap(), sample_token_metadata());
        assert_eq!(token.approved_account_ids.unwrap(), HashMap::new());
    }

    #[test]
    fn test_transfer() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(accounts(0).into(), 5000);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_STORAGE_COST)
            .predecessor_account_id(accounts(0))
            .build());
        let token_id = "0".to_string();
        contract.nft_mint(token_id.clone(), accounts(0), sample_token_metadata());

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(1)
            .predecessor_account_id(accounts(0))
            .build());
        contract.nft_transfer(accounts(1), token_id.clone(), None, None);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .account_balance(env::account_balance())
            .is_view(true)
            .attached_deposit(0)
            .build());
        if let Some(token) = contract.nft_token(token_id.clone()) {
            assert_eq!(token.token_id, token_id);
            assert_eq!(token.owner_id, accounts(1));
            assert_eq!(token.metadata.unwrap(), sample_token_metadata());
            assert_eq!(token.approved_account_ids.unwrap(), HashMap::new());
        } else {
            panic!("token not correctly created, or not found by nft_token");
        }
    }

    #[test]
    fn test_approve() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(accounts(0).into(), 5000);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_STORAGE_COST)
            .predecessor_account_id(accounts(0))
            .build());
        let token_id = "0".to_string();
        contract.nft_mint(token_id.clone(), accounts(0), sample_token_metadata());

        // alice approves bob
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(150000000000000000000)
            .predecessor_account_id(accounts(0))
            .build());
        contract.tokens.nft_approve(token_id.clone(), accounts(1), None);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .account_balance(env::account_balance())
            .is_view(true)
            .attached_deposit(0)
            .build());
        assert!(contract.nft_is_approved(token_id.clone(), accounts(1), Some(1)));
    }

    #[test]
    fn test_revoke() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(accounts(0).into(), 5000);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_STORAGE_COST)
            .predecessor_account_id(accounts(0))
            .build());
        let token_id = "0".to_string();
        contract.nft_mint(token_id.clone(), accounts(0), sample_token_metadata());

        // alice approves bob
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(150000000000000000000)
            .predecessor_account_id(accounts(0))
            .build());
        contract.nft_approve(token_id.clone(), accounts(1), None);

        // alice revokes bob
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(1)
            .predecessor_account_id(accounts(0))
            .build());
        contract.nft_revoke(token_id.clone(), accounts(1));
        testing_env!(context
            .storage_usage(env::storage_usage())
            .account_balance(env::account_balance())
            .is_view(true)
            .attached_deposit(0)
            .build());
        assert!(!contract.nft_is_approved(token_id.clone(), accounts(1), None));
    }

    #[test]
    fn test_revoke_all() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(accounts(0).into(), 5000);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_STORAGE_COST)
            .predecessor_account_id(accounts(0))
            .build());
        let token_id = "0".to_string();
        contract.nft_mint(token_id.clone(), accounts(0), sample_token_metadata());

        // alice approves bob
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(150000000000000000000)
            .predecessor_account_id(accounts(0))
            .build());
        contract.nft_approve(token_id.clone(), accounts(1), None);

        // alice revokes bob
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(1)
            .predecessor_account_id(accounts(0))
            .build());
        contract.nft_revoke_all(token_id.clone());
        testing_env!(context
            .storage_usage(env::storage_usage())
            .account_balance(env::account_balance())
            .is_view(true)
            .attached_deposit(0)
            .build());
        assert!(!contract.nft_is_approved(token_id.clone(), accounts(1), Some(1)));
    }
}