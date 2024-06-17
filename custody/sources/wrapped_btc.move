module custody::wrapped_btc {
    use sui::coin::{Self, TreasuryCap, Coin};

    public struct WRAPPED_BTC has drop {}

    public struct Treasury has key {
        id: UID,
        cap: TreasuryCap<WRAPPED_BTC>
    }

    public struct OwnerCap has key, store {
        id: UID,
    }

    fun init(witness: WRAPPED_BTC, ctx: &mut TxContext) {
        let decimals = 8u8; // BTC decimals is 8 (scallop-io/sui-lending-protocol uses 9)
        let symbol = b"wBTC";
        let name = b"Bridged Bitcoin";
        let description = b"Bridged Bitcoin";
        let icon_url_option = option::none();
        let (treasury_cap, coin_metadata) = coin::create_currency(
            witness,
            decimals,
            symbol,
            name,
            description,
            icon_url_option,
            ctx
        );

        transfer::share_object(
            Treasury {
                id: object::new(ctx),
                cap: treasury_cap
            }
        );
        transfer::public_freeze_object(coin_metadata);

        transfer::transfer(
            OwnerCap {id: object::new(ctx)},
            ctx.sender()
        );
    }

    // only owner can mint
    public fun mint(
        treasury: &mut Treasury,
        _owner_cap: &OwnerCap,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<WRAPPED_BTC> {
        coin::mint(&mut treasury.cap, amount, ctx,)
    }

    // anyone can burn
    public fun burn(
        treasury: &mut Treasury,
        btc: Coin<WRAPPED_BTC>
    ): u64 {
        coin::burn(&mut treasury.cap, btc)
    }
}
