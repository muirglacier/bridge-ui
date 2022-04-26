import { Box, Grow, Typography, useTheme } from "@material-ui/core";
import { GatewaySession } from "@renproject/ren-tx";
import QRCode from "qrcode.react";
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { useEffectOnce } from "react-use";
import {
  ActionButton,
  ActionButtonWrapper,
  BigQrCode,
  CopyContentButton,
  QrCodeIconButton,
  TransactionDetailsButton,
} from "../../../components/buttons/Buttons";
import { NumberFormatText } from "../../../components/formatting/NumberFormatText";
import {
  BigTopWrapper,
  CenteringSpacedBox,
  MediumWrapper,
  SmallWrapper,
} from "../../../components/layout/LayoutHelpers";
import { Link } from "../../../components/links/Links";
import {
  BigDoneIcon,
  ProgressWithContent,
  ProgressWrapper,
  TransactionStatusInfo,
} from "../../../components/progress/ProgressHelpers";
import { BigAssetAmount } from "../../../components/typography/TypographyHelpers";
import { paths } from "../../../pages/routes";
import { useNotifications } from "../../../providers/Notifications";
import {
  usePaperTitle,
  useSetActionRequired,
  useSetPaperTitle,
} from "../../../providers/TitleProviders";
import { DepositEntry } from "../../../services/bridge";
import { orangeLight } from "../../../theme/colors";
import { getChainConfigByRentxName } from "../../../utils/assetConfigs";
import { trimAddress } from "../../../utils/strings";
import { useFetchFees } from "../../fees/feesHooks";
import { getTransactionFees } from "../../fees/feesUtils";
import { useBrowserNotifications } from "../../notifications/notificationsUtils";
import {
  HMSCountdown,
  ProcessingTimeWrapper,
  SubmitErrorDialog,
} from "../../transactions/components/TransactionsHelpers";
import { getPaymentLink, txExpirySorter, TxType } from "../../transactions/transactionsUtils";
import { resetMint } from "../mintSlice";
import { getLockAndMintParams, getRemainingGatewayTime } from "../mintUtils";
import { AddressValidityMessage } from "./MintHelpers";

export type MintDepositToProps = {
  tx: GatewaySession;
};

export const MintDepositToStatus: FunctionComponent<MintDepositToProps> = ({
  tx,
}) => {
  const {
    lockCurrencyConfig,
    lockChainConfig,
    suggestedAmount,
    mintAddressLink,
  } = getLockAndMintParams(tx);
  const { color } = lockCurrencyConfig;
  const { MainIcon } = lockChainConfig;

  useSetPaperTitle(`Send ${lockChainConfig.short}`);

  return (
    <>
      <ProgressWrapper>
        <ProgressWithContent color={color || orangeLight} size={64}>
          <MainIcon fontSize="inherit" color="inherit" />
        </ProgressWithContent>
      </ProgressWrapper>
      <MediumWrapper>
        <BigAssetAmount
          value={
            <span>
              Send {lockCurrencyConfig.short} to
            </span>
          }
        />
      </MediumWrapper>
      {tx.gatewayAddress && (
        <>
            <CenteringSpacedBox>
              <Grow in={true}>
                <BigQrCode>
                  <QRCode
                    value={getPaymentLink(
                      lockChainConfig.symbol,
                      tx.gatewayAddress,
                      suggestedAmount
                    )}
                  />
                </BigQrCode>
              </Grow>
            </CenteringSpacedBox>
          <CopyContentButton content={tx.gatewayAddress} />
        </>
      )}
    </>
  );
};

type MintDepositConfirmationStatusProps = {
  tx: GatewaySession;
  depositHash: string;
};

export const MintDepositConfirmationStatus: FunctionComponent<MintDepositConfirmationStatusProps> = ({
  tx,
  depositHash,
}) => {
  const [, setTitle] = usePaperTitle();
  let {
    lockCurrencyConfig,
    lockChainConfig,
    lockTxHash,
    lockTxLink,
    lockTxAmount,
    lockConfirmations,
    lockTargetConfirmations,
    lockProcessingTime,
  } = getLockAndMintParams(tx, depositHash);

  const dep: DepositEntry = tx.transactions[depositHash]
  lockTxHash = depositHash
  lockTxLink = "https://defiscan.live/transactions/" + depositHash.split(":")[0]
  lockConfirmations = dep?.confirmations || 0
  const vout = dep?.vout?.value || "???"
  const { MainIcon } = lockChainConfig;
  lockTargetConfirmations = lockChainConfig?.targetConfirmations || 0

  const confirmed = lockConfirmations >= lockTargetConfirmations;
  useEffect(() => {
    setTitle(confirmed ? "Confirmed" : "Confirming");
  }, [setTitle, confirmed]);

  return (
    <>
      <ProgressWrapper>
        <ProgressWithContent
          color={lockCurrencyConfig.color || orangeLight}
          confirmations={lockConfirmations}
          targetConfirmations={lockTargetConfirmations}
        >
          <MainIcon fontSize="inherit" color="inherit" />
        </ProgressWithContent>
      </ProgressWrapper>
      <SmallWrapper>
        <Typography variant="h5" align="center">
          <b>Received {vout} DFI</b>
        </Typography>
        <Typography variant="body1" align="center">
          {lockConfirmations} of {lockTargetConfirmations} confirmations
        </Typography>
      </SmallWrapper>
      <MediumWrapper>
        <BigAssetAmount
          value={
            <NumberFormatText
              value={lockTxAmount}
              spacedSuffix={lockCurrencyConfig.short}
            />
          }
        />
      </MediumWrapper>
      <TransactionDetailsButton
        label={lockChainConfig.short}
        address={lockTxHash}
        link={lockTxLink}
      />
      
    </>
  );
};

const maxConfirmations = (actual: number, target: number) => {
  if (actual > target) {
    return target;
  }
  return actual;
};

type MintDepositAcceptedStatusProps = {
  tx: GatewaySession;
  onSubmit?: () => void;
  onReload?: () => void;
  submitting: boolean;
  submittingError: boolean;
  depositHash: string;
};

export const MintDepositAcceptedStatus: FunctionComponent<MintDepositAcceptedStatusProps> = ({
  tx,
  onSubmit,
  onReload,
  submitting,
  submittingError,
  depositHash,
}) => {
  useSetPaperTitle("Submit");
  useSetActionRequired(true);
  const theme = useTheme();
  let {
    lockCurrencyConfig,
    lockChainConfig,
    lockTxHash,
    lockTxAmount,
    lockTxLink,
    lockConfirmations,
    lockTargetConfirmations,
    mintChainConfig,
  } = getLockAndMintParams(tx, depositHash);
  const dep: DepositEntry = tx.transactions[depositHash]
  lockTxHash = depositHash
  lockTxLink = "https://defiscan.live/transactions/" + depositHash.split(":")[0]
  lockConfirmations = dep?.confirmations || 0
  const vout = dep?.vout?.value || "???"
  lockTargetConfirmations = lockChainConfig?.targetConfirmations || 0

  const notificationMessage = `${lockConfirmations>lockTargetConfirmations?lockTargetConfirmations:lockConfirmations}/${lockTargetConfirmations} confirmations, ready to submit ${
    lockCurrencyConfig.short
  } to ${mintChainConfig.full}?`;
  const { showNotification } = useNotifications();
  const { showBrowserNotification } = useBrowserNotifications();
  useEffectOnce(() => {
    showNotification(notificationMessage);
    showBrowserNotification(notificationMessage);
  });

  const { MainIcon } = lockChainConfig;

  return (
    <>
      <ProgressWrapper>
        {submitting ? (
          <ProgressWithContent color={theme.customColors.skyBlue} processing>
            <MainIcon fontSize="inherit" color="inherit" />
          </ProgressWithContent>
        ) : (
          <ProgressWithContent
            color={lockCurrencyConfig.color || theme.customColors.skyBlue}
            confirmations={lockConfirmations}
            targetConfirmations={lockTargetConfirmations}
          >
            <MainIcon fontSize="inherit" color="inherit" />
          </ProgressWithContent>
        )}
      </ProgressWrapper>
      <Typography variant="h5" align="center">
          <b>Received {vout} DFI</b>
        </Typography>
      <Typography variant="body1" align="center" gutterBottom>
        <NumberFormatText
          value={lockTxAmount}
          spacedSuffix={lockCurrencyConfig.full}
        />{" "}
        Received {lockConfirmations>lockTargetConfirmations?lockTargetConfirmations:lockConfirmations}/{lockTargetConfirmations} Confirmations
      </Typography>
      <ActionButtonWrapper>
        <ActionButton onClick={onSubmit} disabled={submitting}>
          {submitting ? "Submitting" : "Submit"} to {mintChainConfig.full}
          {submitting && "..."}
        </ActionButton>
      </ActionButtonWrapper>
      <ActionButtonWrapper>
        <TransactionDetailsButton
          label={lockChainConfig.short}
          address={lockTxHash}
          link={lockTxLink}
        />
      </ActionButtonWrapper>
      <SubmitErrorDialog open={submittingError} onAction={onReload} />
    </>
  );
};

type DestinationPendingStatusProps = {
  tx: GatewaySession;
  onSubmit?: () => void;
  submitting: boolean;
  depositHash: string;
};

export const DestinationPendingStatus: FunctionComponent<DestinationPendingStatusProps> = ({
  tx,
  onSubmit = () => {},
  submitting,
  depositHash,
}) => {
  const theme = useTheme();
  let  {
    lockCurrencyConfig,
    lockChainConfig,
    lockTxHash,
    lockTxAmount,
    lockTxLink,
    mintTxLink,
    mintTxHash,
    mintChainConfig,
  } = getLockAndMintParams(tx, depositHash);

  const dep: DepositEntry = tx.transactions[depositHash]
  lockTxHash = depositHash
  lockTxLink = "https://defiscan.live/transactions/" + depositHash.split(":")[0]

  return (
    <>
      <ProgressWrapper>
        <ProgressWithContent color={theme.customColors.skyBlue} processing>
          <TransactionStatusInfo
            status="Pending"
            chain={mintChainConfig.full}
            address={
              <Link
                color="primary"
                underline="hover"
                href={mintTxLink}
                target="_blank"
              >
                {mintTxHash}
              </Link>
            }
          />
        </ProgressWithContent>
      </ProgressWrapper>
      <Typography variant="body1" align="center" gutterBottom>
        <NumberFormatText
          value={lockTxAmount}
          spacedSuffix={lockCurrencyConfig.full}
        />
      </Typography>
      <ActionButtonWrapper>
        <ActionButton onClick={onSubmit} disabled={submitting}>
          {submitting ? "Submitting" : "Submit"} to {mintChainConfig.full}
          {submitting && "..."}
        </ActionButton>
      </ActionButtonWrapper>
      <ActionButtonWrapper>
        <TransactionDetailsButton
          label={lockChainConfig.short}
          address={lockTxHash}
          link={lockTxLink}
        />
      </ActionButtonWrapper>
    </>
  );
};

type MintCompletedStatusProps = {
  tx: GatewaySession;
  depositHash: string;
  mintHash: string;
  chain: string;
};

export const MintCompletedStatus: FunctionComponent<MintCompletedStatusProps> = ({
  tx,
  depositHash,
  mintHash,
  chain
}) => {
  useSetPaperTitle("Complete");
  const dispatch = useDispatch();
  const history = useHistory();
  let {
    lockCurrencyConfig,
    mintCurrencyConfig,
    lockChainConfig,
    lockTxLink,
    lockTxAmount,
    mintTxLink,
    mintChainConfig,
  } = getLockAndMintParams(tx, depositHash);

  lockTxLink = "https://defiscan.live/transactions/" + depositHash.split(":")[0]
  if(chain == "ethereum"){
    mintTxLink="https://etherscan.io/tx/" + mintHash
  }else{
    mintTxLink="https://bscscan.com/tx/" + mintHash
  }

  const { fees, pending } = useFetchFees(
    lockCurrencyConfig.symbol,
    TxType.MINT
  );
  const { conversionTotal } = getTransactionFees({
    fees,
    type: TxType.MINT,
  });
  const handleReturn = useCallback(() => {
    history.push(paths.MINT);
    dispatch(resetMint());
  }, [dispatch, history]);

  const { showNotification } = useNotifications();
  const { showBrowserNotification } = useBrowserNotifications();

  const showNotifications = useCallback(() => {
    if (!pending) {
      const notificationMessage = `Successfully minted ${mintCurrencyConfig.short} on ${mintChainConfig.full}.`;
      showNotification(
        <span>
          {notificationMessage}{" "}
          <Link external href={mintTxLink}>
            View {mintChainConfig.full} transaction
          </Link>
        </span>
      );
      showBrowserNotification(notificationMessage);
    }
  }, [
    showNotification,
    showBrowserNotification,
    pending,
    conversionTotal,
    mintChainConfig,
    mintCurrencyConfig,
    mintTxLink,
  ]);

  useEffect(showNotifications, [pending]);

  return (
    <>
      <ProgressWrapper>
        <ProgressWithContent>
          <BigDoneIcon />
        </ProgressWithContent>
      </ProgressWrapper>
      <ActionButtonWrapper>
        <ActionButton onClick={handleReturn}>Back to start</ActionButton>
      </ActionButtonWrapper>
      <Box display="flex" justifyContent="space-between" flexWrap="wrap" py={2}>
        <Link
          external
          color="primary"
          variant="button"
          underline="hover"
          href={lockTxLink}
        >
          {lockChainConfig.full} transaction
        </Link>
        <Link
          external
          color="primary"
          variant="button"
          underline="hover"
          href={mintTxLink}
        >
          {mintChainConfig.full} transaction
        </Link>
      </Box>
    </>
  );
};
