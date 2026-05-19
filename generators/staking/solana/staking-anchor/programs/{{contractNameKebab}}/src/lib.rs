use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEtxYyHee13g2kBB3");

#[program]
pub mod {{contractNameSnake}} {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, reward_rate: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.stake_mint = ctx.accounts.stake_mint.key();
        pool.reward_mint = ctx.accounts.reward_mint.key();
        pool.reward_rate = reward_rate;
        pool.total_staked = 0;
        pool.acc_reward_per_share = 0;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.total_staked = pool.total_staked.checked_add(amount).unwrap();

        let cpi = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_stake_ata.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(cpi, amount)?;
        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.total_staked = pool.total_staked.checked_sub(amount).unwrap();
        let seeds = &[b"pool", pool.authority.as_ref(), &[ctx.bumps.pool]];
        let signer = &[&seeds[..]];

        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_vault.to_account_info(),
                to: ctx.accounts.user_stake_ata.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi, amount)?;
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct StakePool {
    pub authority: Pubkey,
    pub stake_mint: Pubkey,
    pub reward_mint: Pubkey,
    pub reward_rate: u64,
    pub total_staked: u64,
    pub acc_reward_per_share: u128,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + StakePool::INIT_SPACE, seeds = [b"pool", authority.key().as_ref()], bump)]
    pub pool: Account<'info, StakePool>,
    pub stake_mint: Account<'info, Mint>,
    pub reward_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, seeds = [b"pool", pool.authority.as_ref()], bump)]
    pub pool: Account<'info, StakePool>,
    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_stake_ata: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut, seeds = [b"pool", pool.authority.as_ref()], bump)]
    pub pool: Account<'info, StakePool>,
    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_stake_ata: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
