/**
 * 错误边界组件 - 捕获 React 渲染错误
 * 
 * 使用方式：
 * <ErrorBoundary fallback={CustomFallback} component="MyComponent">
 *   <MyComponent />
 * </ErrorBoundary>
 */

import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { captureError, ErrorType } from '../services/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // 上报错误
    const componentError = new Error(error.message);
    componentError.type = ErrorType.RENDER;
    componentError.stack = error.stack;
    
    captureError(componentError, {
      component: this.props.component || 'ErrorBoundary',
      action: 'render',
      extra: {
        errorInfo: errorInfo?.componentStack,
        props: this.props,
      },
    });
    
    console.error('[ErrorBoundary] 捕获渲染错误:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用自定义的
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
          />
        );
      }

      // 默认错误界面
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.icon}>😕</Text>
            <Text style={styles.title}>出错了</Text>
            <Text style={styles.message}>
              {this.props.component || '组件'}加载失败
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>错误信息:</Text>
                <Text style={styles.debugText}>{this.state.error.message}</Text>
                {this.state.errorInfo?.componentStack && (
                  <>
                    <Text style={styles.debugTitle}>组件堆栈:</Text>
                    <Text style={styles.debugText} numberOfLines={10}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </>
                )}
              </View>
            )}
            <Button title="重试" onPress={this.handleRetry} color="#FF6B6B" />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 8,
  },
  debugText: {
    fontSize: 11,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default ErrorBoundary;
