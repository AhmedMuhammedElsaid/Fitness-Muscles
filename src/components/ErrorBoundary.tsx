import { Component, type ReactNode } from 'react';
import { View, Text } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { PrimaryButton } from '@/components/ui';
import i18n from '@/lib/i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack ?? undefined } },
    });
  }

  private reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-primary font-sans text-xl font-semibold mb-2 text-center">
          {i18n.t('common.errorTitle')}
        </Text>
        <Text className="text-primary/70 font-sans text-base mb-8 text-center">
          {i18n.t('common.errorMessage')}
        </Text>
        <PrimaryButton
          title={i18n.t('common.retry')}
          onPress={this.reset}
          className="w-full"
        />
      </View>
    );
  }
}
