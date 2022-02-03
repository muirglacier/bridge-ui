import { Divider, IconButton, Typography } from "@material-ui/core";
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ReleaseShortcutCompletedStatus,
  ReleaseProgressStatus,
} from '../components/ReleaseStatuses'
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { useNotifications } from "../../../providers/Notifications";

import {
  ActionButton,
  ActionButtonWrapper,
} from "../../../components/buttons/Buttons";
import { NumberFormatText } from "../../../components/formatting/NumberFormatText";
import { BackArrowIcon } from "../../../components/icons/RenIcons";
import {
  PaperActions,
  PaperContent,
  PaperHeader,
  PaperNav,
  PaperTitle,
} from "../../../components/layout/Paper";
import { CenteredProgress } from "../../../components/progress/ProgressHelpers";
import {validate, Network} from '../releaseAddressValidator'
import {
  AssetInfo,
  BigAssetAmount,
  BigAssetAmountWrapper,
  LabelWithValue,
  MiddleEllipsisText,
  SpacedDivider,
} from "../../../components/typography/TypographyHelpers";
import { paths } from "../../../pages/routes";
import { db } from "../../../services/database/database";
import {
  getChainConfig,
  getCurrencyConfig,
  toReleasedCurrency,
} from "../../../utils/assetConfigs";
import { useFetchFees } from "../../fees/feesHooks";
import { getTransactionFees } from "../../fees/feesUtils";
import { $renNetwork } from "../../network/networkSlice";
import { TransactionFees } from "../../transactions/components/TransactionFees";
import {
  addTransaction,
  setCurrentTxId,
} from "../../transactions/transactionsSlice";
import {useBurn, useToken} from "../../wallet/walletHooks"
import {
  createTxQueryString,
  LocationTxState,
  TxConfigurationStepProps,
  TxType,
} from "../../transactions/transactionsUtils";
import {
  useAuthRequired,
  useSelectedChainWallet,
} from "../../wallet/walletHooks";
import {
  $multiwalletChain,
  $wallet,
  setWalletPickerOpened,
} from "../../wallet/walletSlice";
import { releaseTooltips } from "../components/ReleaseHelpers";
import { $release } from "../releaseSlice";
import {
  createReleaseTransaction,
  preValidateReleaseTransaction,
} from "../releaseUtils";
import { releaseChainClassMap } from "../../../services/rentx";

export const ReleaseFeesStep: FunctionComponent<TxConfigurationStepProps> = ({
  onPrev,
}) => {
  useAuthRequired(true);
  const dispatch = useDispatch();
  const history = useHistory();
  const { account, walletConnected } = useSelectedChainWallet();
  const [releasingInitialized, setReleasingInitialized] = useState(false);
  const [releaseTxId, setReleaseTxId] = useState("");
  const { currency, address, amount } = useSelector($release);
  const network = useSelector($renNetwork);
  const {
    chain,
    signatures: { signature },
  } = useSelector($wallet);
  const renChain = useSelector($multiwalletChain);
  const { fees, pending } = useFetchFees(currency, TxType.BURN);
  const {getBurn} = useBurn()

  const currencyConfig = getCurrencyConfig(currency);
  const chainConfig = getChainConfig(chain);
  const destinationCurrency = toReleasedCurrency(currency);
  
  const destinationCurrencyConfig = getCurrencyConfig(destinationCurrency);
  const { MainIcon } = destinationCurrencyConfig;
  const tx = useMemo(
    () =>
      createReleaseTransaction({
        currency: currency,
        destAddress: address,
        userAddress: account,
        sourceChain: renChain,
        network: network,
      }),
    [currency, address, account, renChain, network]
  );
  const canInitializeReleasing = preValidateReleaseTransaction(tx);
  const { showNotification, closeNotification } = useNotifications();

  const handleConfirm = useCallback(async() => {
    setReleasingInitialized(true);
    if (walletConnected) {
      let res: any = await getBurn(address, amount, tx.sourceAsset)
      console.log(res)
      if(res.err!==null && res.err?.code != 0) {
        setReleasingInitialized(false);
        showNotification(res.err?.message as string || "", {
          variant: "error",
          persist: false,
        });
      }else{
        setReleasingInitialized(false);
        setReleaseTxId(res.result); // TODO: DO METAFUCK MAGIC HERE!
      }
    } else {
      setReleasingInitialized(false);
      dispatch(setWalletPickerOpened(true));
    }
  }, [dispatch, canInitializeReleasing, walletConnected]);
  const targetCurrency = toReleasedCurrency(currency);
  const releaseCurrencyConfig = getCurrencyConfig(targetCurrency);
  const releaseChainConfig = getChainConfig(releaseCurrencyConfig.sourceChain);
  const validateAddress = useMemo(() => {
     // TODO: improve this
     return validate(address, Network.mainnet)

  }, [releaseChainConfig.rentxName, network, address]);

 if (releaseTxId!="")
  return (
    <>
    <PaperHeader>
        <PaperNav>
          <IconButton onClick={onPrev}>
            <BackArrowIcon />
          </IconButton>
        </PaperNav>
        <PaperTitle>All Done</PaperTitle>
        <PaperActions />
      </PaperHeader>
      <PaperContent bottomPadding>
      <ReleaseShortcutCompletedStatus txid={releaseTxId} amount={amount} chain={tx.sourceChain} onPrev={onPrev}/>
      </PaperContent>
    </>)
 else return (
     <>
      <PaperHeader>
        <PaperNav>
          <IconButton onClick={onPrev}>
            <BackArrowIcon />
          </IconButton>
        </PaperNav>
        <PaperTitle>Fees & Confirm</PaperTitle>
        <PaperActions />
      </PaperHeader>

      <PaperContent bottomPadding>
        <BigAssetAmountWrapper>
          <BigAssetAmount
            value={
              <NumberFormatText
                value={amount}
                spacedSuffix={currencyConfig.short}
              />
            }
          />
        </BigAssetAmountWrapper>
        <Typography variant="body1" gutterBottom>
          Details
        </Typography>
        <LabelWithValue
          label="Releasing"
          labelTooltip={releaseTooltips.releasing}
          value={
            <NumberFormatText
              value={amount}
              spacedSuffix={currencyConfig.short}
            />
          }
        />
        <LabelWithValue
          label="From"
          labelTooltip={releaseTooltips.from}
          value={chainConfig.full}
        />
        <LabelWithValue
          label="To"
          labelTooltip={releaseTooltips.to}
          value={<MiddleEllipsisText hoverable>{address}</MiddleEllipsisText>}
        />
        <SpacedDivider />
        <Typography variant="body1" gutterBottom>
          Fees
        </Typography>
        <TransactionFees
          chain={chain}
          currency={currency}
          type={TxType.BURN}
          hideButton={true}
        />
      </PaperContent>
      <Divider />
      <PaperContent darker topPadding bottomPadding>
        <ActionButtonWrapper>
          <ActionButton onClick={handleConfirm} disabled={releasingInitialized || amount<=0.1 || !validateAddress}>
            {!walletConnected
              ? "Connect Wallet"
              : releasingInitialized
              ? "Confirming..."
              : "Confirm"}
          </ActionButton>
        </ActionButtonWrapper>
      </PaperContent>
    </>
  );
};
