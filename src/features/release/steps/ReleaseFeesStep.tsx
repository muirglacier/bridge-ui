import { Divider, IconButton, Typography } from "@material-ui/core";
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
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

export const ReleaseFeesStep: FunctionComponent<TxConfigurationStepProps> = ({
  onPrev,
}) => {
  useAuthRequired(true);
  const dispatch = useDispatch();
  const history = useHistory();
  const { account, walletConnected } = useSelectedChainWallet();
  const [releasingInitialized, setReleasingInitialized] = useState(false);
  const { currency, address } = useSelector($release);
  const network = useSelector($renNetwork);
  const {
    chain,
    signatures: { signature },
  } = useSelector($wallet);
  const renChain = useSelector($multiwalletChain);
  const { fees, pending } = useFetchFees(currency, TxType.BURN);
  
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

  const handleConfirm = useCallback(() => {
    setReleasingInitialized(true);
    if (walletConnected) {
      if (canInitializeReleasing) {
        setReleasingInitialized(true);
      } else {
        setReleasingInitialized(false);
      }
    } else {
      setReleasingInitialized(false);
      dispatch(setWalletPickerOpened(true));
    }
  }, [dispatch, canInitializeReleasing, walletConnected]);

  const onReleaseTxCreated = useCallback(
    (tx) => {
      const dbTx = { ...tx };
      db.addTx(dbTx, account, signature).then(() => {
        dispatch(setCurrentTxId(tx.id));
        dispatch(addTransaction(tx));
        history.push({
          pathname: paths.RELEASE_TRANSACTION,
          search: "?" + createTxQueryString(tx),
          state: {
            txState: { newTx: true },
          } as LocationTxState,
        });
      });
    },
    [dispatch, history, account, signature]
  );

  useEffect(() => {
    if (releasingInitialized) {
      onReleaseTxCreated(tx);
    }
  }, [onReleaseTxCreated, releasingInitialized, tx]);

  return (
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
                value={0}
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
              value={0}
              spacedSuffix={currencyConfig.short}
            />
          }
          valueEquivalent={
            <NumberFormatText
              value={0}
              spacedSuffix="USD"
              decimalScale={2}
              fixedDecimalScale
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
        />
      </PaperContent>
      <Divider />
      <PaperContent darker topPadding bottomPadding>
        {walletConnected &&
          (pending ? (
            <CenteredProgress />
          ) : (
            <AssetInfo
              label="Receiving"
              value={
                <NumberFormatText
                  value={0}
                  spacedSuffix={destinationCurrencyConfig.short}
                />
              }
              valueEquivalent={
                <NumberFormatText
                  prefix=" = $"
                  value={0}
                  spacedSuffix="USD"
                  decimalScale={2}
                  fixedDecimalScale
                />
              }
              Icon={<MainIcon fontSize="inherit" />}
            />
          ))}
        <ActionButtonWrapper>
          <ActionButton onClick={handleConfirm} disabled={releasingInitialized}>
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
