import React, { FunctionComponent } from "react";
import { useSelector } from "react-redux";
import { NumberFormatText } from "../../../components/formatting/NumberFormatText";
import { CenteredProgress } from "../../../components/progress/ProgressHelpers";
import {
  LabelWithValue,
  MiddleEllipsisText,
} from "../../../components/typography/TypographyHelpers";
import { Debug } from "../../../components/utils/Debug";
import { WalletStatus } from "../../../components/utils/types";
import { MINT_GAS_UNIT_COST } from "../../../constants/constants";
import {
  BridgeChain,
  BridgeCurrency,
  getChainConfig,
  getCurrencyConfig,
  toReleasedCurrency,
} from "../../../utils/assetConfigs";
import { fromGwei } from "../../../utils/converters";
import { useFetchFees } from "../../fees/feesHooks";
import { getTransactionFees } from "../../fees/feesUtils";

import { mintTooltips } from "../../mint/components/MintHelpers";
import { useSelectedChainWallet } from "../../wallet/walletHooks";
import { getFeeTooltips, TxType } from "../transactionsUtils";

type TransactionFeesProps = {
  type: TxType;
  currency: BridgeCurrency;
  chain: BridgeChain;
  address?: string;
};

export const TransactionFees: FunctionComponent<TransactionFeesProps> = ({
  currency,
  type,
  chain,
  address,
}) => {
  const { status } = useSelectedChainWallet();
  const currencyConfig = getCurrencyConfig(currency);
  const targetChainConfig = getChainConfig(chain);


  const { fees, pending } = useFetchFees(currency, type);
  const { renVMFee, renVMFeeAmount, networkFee } = getTransactionFees({
    fees,
    type,
  });
 

  const sourceCurrency =
    type === TxType.MINT ? currency : toReleasedCurrency(currency);
  const sourceCurrencyConfig = getCurrencyConfig(sourceCurrency);
  const sourceCurrencyChainConfig = getChainConfig(
    sourceCurrencyConfig.sourceChain
  );

  const tooltips = getFeeTooltips({
    mintFee: fees.mint / 10000,
    releaseFee: fees.burn / 10000,
    sourceCurrency,
    chain,
  });

  const feeInGwei = 1337; // gas price to real gas price adjustment
  const targetChainFeeNative = fromGwei(feeInGwei);
  const targetChainCurrency = getCurrencyConfig(
    targetChainConfig.nativeCurrency
  );

  if (status !== WalletStatus.CONNECTED) {
    return null;
  }
  if (pending) {
    return <CenteredProgress />;
  }
  return (
    <>
      <Debug it={{ currency, fees }} />
      <LabelWithValue
        label="Bridge Node Fee"
        labelTooltip={tooltips.renVmFee}
        value={
          <NumberFormatText
            value={renVMFee}
            spacedSuffix={"%"}
            decimalScale={2}
          />
        }
      />
      <LabelWithValue
        label={`${sourceCurrencyChainConfig.full} Miner Fee`}
        labelTooltip={tooltips.sourceChainMinerFee}
        value={
          <NumberFormatText
            value={networkFee}
            spacedSuffix={sourceCurrencyChainConfig.short}
          />
        }
      />
      <LabelWithValue
        label={`Esti. ${targetChainConfig.short} Fee`}
        labelTooltip={tooltips.renCurrencyChainFee}
        value={
          <NumberFormatText
            value={targetChainFeeNative}
            spacedSuffix={targetChainCurrency.short}
            decimalScale={4}
          />
        }
      />
      {address && (
        <LabelWithValue
          label="Recipient Address"
          labelTooltip={mintTooltips.recipientAddress}
          value={<MiddleEllipsisText hoverable>{address}</MiddleEllipsisText>}
        />
      )}
    </>
  );
};
