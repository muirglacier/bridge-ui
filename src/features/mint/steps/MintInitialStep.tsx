import { DialogContent, Divider, Typography } from '@material-ui/core'
import React, { FunctionComponent, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from '../../../components/links/Links'
import {
  ActionButton,
  ActionButtonWrapper,
  ActionButtonWrapperGapped,
} from '../../../components/buttons/Buttons'
import {
  AssetDropdown,
  AssetDropdownWrapper,
} from '../../../components/dropdowns/AssetDropdown'
import { NumberFormatText } from '../../../components/formatting/NumberFormatText'
import {
  BigCurrencyInput,
  BigCurrencyInputWrapper,
} from '../../../components/inputs/BigCurrencyInput'
import { PaperContent } from '../../../components/layout/Paper'
import { CenteredProgress, ProgressWithContent, ProgressWrapper } from '../../../components/progress/ProgressHelpers'
import { TooltipWithIcon } from '../../../components/tooltips/TooltipWithIcon'
import { AssetInfo } from '../../../components/typography/TypographyHelpers'
import {
  getCurrencyConfig,
  supportedLockCurrencies,
  supportedMintDestinationChains,
  toMintedCurrency,
} from '../../../utils/assetConfigs'
import { useFetchFees } from '../../fees/feesHooks'
import { getTransactionFees } from '../../fees/feesUtils'
import { useRenNetworkTracker } from '../../transactions/transactionsHooks'
import {
  isMinimalAmount,
  TxConfigurationStepProps,
  TxType,
} from '../../transactions/transactionsUtils'
import { useSelectedChainWallet } from '../../wallet/walletHooks'
import {
  $wallet,
  setChain,
  setWalletPickerOpened,
} from '../../wallet/walletSlice'
import {
  $mint,
  setMintCurrency,
} from '../mintSlice'
import { WalletPickerProps } from '@renproject/multiwallet-ui'
import { BridgeModal, BridgeModalTitle } from '../../../components/modals/BridgeModal'
import { DebugComponentProps } from '../../../components/utils/Debug'



export const MintInitialStep: FunctionComponent<TxConfigurationStepProps> = ({
  onNext,
}) => {
  const dispatch = useDispatch();

  const { currency } = useSelector($mint);
  const { chain } = useSelector($wallet);
  const { walletConnected } = useSelectedChainWallet();

  const [recoverOpened, setRecoverOpened] = useState(false);
  const handleRecover = useCallback((e) => {
    setRecoverOpened(true);
    e.preventDefault();
  }, []);
  const handleRecoverClose = useCallback(() => {
    setRecoverOpened(false);
  }, []);
 

  const handleCurrencyChange = useCallback(
    (event) => {
      dispatch(setMintCurrency(event.target.value));
    },
    [dispatch]
  );
  const handleChainChange = useCallback(
    (event) => {
      dispatch(setChain(event.target.value));
    },
    [dispatch]
  );

  const renCurrency = toMintedCurrency(currency);
  useRenNetworkTracker(renCurrency);

  const enabled = true;

  const handleNextStep = useCallback(() => {
    if (!walletConnected) {
      dispatch(setWalletPickerOpened(true));
    } else {
      if (onNext && enabled) {
        onNext();
      }
    }
  }, [dispatch, onNext, walletConnected, enabled]);

  const mintedCurrencySymbol = toMintedCurrency(currency);
  const mintedCurrencyConfig = getCurrencyConfig(mintedCurrencySymbol);
  const { GreyIcon } = mintedCurrencyConfig;

  return (
    <>
      <PaperContent bottomPadding>
        <AssetDropdownWrapper>
          <AssetDropdown
            label="Send"
            mode="send"
            available={supportedLockCurrencies}
            value={currency}
            onChange={handleCurrencyChange}
          />
        </AssetDropdownWrapper>
        <AssetDropdownWrapper>
          <AssetDropdown
            label="Destination"
            mode="chain"
            available={supportedMintDestinationChains}
            value={chain}
            onChange={handleChainChange}
          />
        </AssetDropdownWrapper>
      </PaperContent>
      <Divider />
      <PaperContent darker topPadding bottomPadding>         
        <ActionButtonWrapper>
          <ActionButton
            onClick={handleNextStep}
            disabled={walletConnected ? !enabled : false}
          >
            {walletConnected ? "Next" : "Connect Wallet"}
          </ActionButton>
        </ActionButtonWrapper>
        <Typography
          variant="subtitle2"
          align="center"
          color="textSecondary"
          gutterBottom
        >
        <Link href={'#'} onClick={handleRecover} color='textSecondary'>
            Click here to recover an incomplete transaction
        </Link>
        </Typography>
      </PaperContent>
      <BridgeModal
        open={recoverOpened}
        title="Recovery"
        onClose={handleRecoverClose}
      >
      <DialogContent>
          <Typography variant="body1" align="center" gutterBottom>
            Limited wallet support
          </Typography>
      </DialogContent>
      </BridgeModal>
      
    </>
  );
};
