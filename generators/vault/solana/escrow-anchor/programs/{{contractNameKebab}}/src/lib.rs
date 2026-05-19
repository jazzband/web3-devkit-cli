use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEtxYyHee13g2kBB3");

#[program]
pub mod {{contractNameSnake}} {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.maker = ctx.accounts.maker.key();
        escrow.taker = ctx.accounts.taker.key();
        escrow.amount = amount;
        escrow.released = false;

        let cpi = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.maker_token.to_account_info(),
                to: ctx.accounts.escrow_vault.to_account_info(),
                authority: ctx.accounts.maker.to_account_info(),
            },
        );
        token::transfer(cpi, amount)?;
        Ok(())
    }

    pub fn release(ctx: Context<Release>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(!escrow.released, EscrowError::AlreadyReleased);
        escrow.released = true;

        let seeds = &[
            b"escrow",
            escrow.maker.as_ref(),
            escrow.taker.as_ref(),
            &[ctx.bumps.escrow],
        ];
        let signer = &[&seeds[..]];

        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.taker_token.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi, escrow.amount)?;
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct EscrowAccount {
    pub maker: Pubkey,
    pub taker: Pubkey,
    pub amount: u64,
    pub released: bool,
}

#[error_code]
pub enum EscrowError {
    #[msg("Escrow already released")]
    AlreadyReleased,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = maker, space = 8 + EscrowAccount::INIT_SPACE, seeds = [b"escrow", maker.key().as_ref(), taker.key().as_ref()], bump)]
    pub escrow: Account<'info, EscrowAccount>,
    /// CHECK: taker pubkey
    pub taker: UncheckedAccount<'info>,
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(mut)]
    pub maker_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Release<'info> {
    #[account(mut, seeds = [b"escrow", escrow.maker.as_ref(), escrow.taker.as_ref()], bump)]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub taker_token: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
