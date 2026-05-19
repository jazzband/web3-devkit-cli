use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEtxYyHee13g2kBB3");

/// Binary prediction market skeleton — extend with SPL transfers and oracle resolution
#[program]
pub mod {{contractNameSnake}} {
    use super::*;

    pub fn create_market(ctx: Context<CreateMarket>, end_ts: i64) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.end_ts = end_ts;
        market.resolved = false;
        market.outcome_yes = false;
        market.yes_pool = 0;
        market.no_pool = 0;
        Ok(())
    }

    pub fn bet_yes(ctx: Context<Bet>, amount: u64) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(Clock::get()?.unix_timestamp < market.end_ts, MarketError::Closed);
        require!(!market.resolved, MarketError::Resolved);
        market.yes_pool = market.yes_pool.checked_add(amount).unwrap();
        Ok(())
    }

    pub fn bet_no(ctx: Context<Bet>, amount: u64) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(Clock::get()?.unix_timestamp < market.end_ts, MarketError::Closed);
        require!(!market.resolved, MarketError::Resolved);
        market.no_pool = market.no_pool.checked_add(amount).unwrap();
        Ok(())
    }

    pub fn resolve(ctx: Context<Resolve>, outcome_yes: bool) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(Clock::get()?.unix_timestamp >= market.end_ts, MarketError::NotEnded);
        market.resolved = true;
        market.outcome_yes = outcome_yes;
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub authority: Pubkey,
    pub end_ts: i64,
    pub resolved: bool,
    pub outcome_yes: bool,
    pub yes_pool: u64,
    pub no_pool: u64,
}

#[error_code]
pub enum MarketError {
    #[msg("Market closed")]
    Closed,
    #[msg("Already resolved")]
    Resolved,
    #[msg("Market not ended")]
    NotEnded,
}

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(init, payer = authority, space = 8 + Market::INIT_SPACE)]
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Bet<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Resolve<'info> {
    #[account(mut, has_one = authority)]
    pub market: Account<'info, Market>,
    pub authority: Signer<'info>,
}
