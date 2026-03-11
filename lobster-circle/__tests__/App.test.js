/**
 * App 组件测试
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../App';

describe('App 组件', () => {
  it('应该渲染登录页面（未登录状态）', () => {
    const { getByText } = render(<App />);
    expect(getByText(/龙虾圈/)).toBeTruthy();
    expect(getByText('登录')).toBeTruthy();
  });

  it('应该显示用户名输入框', () => {
    const { getByPlaceholderText } = render(<App />);
    expect(getByPlaceholderText('用户名')).toBeTruthy();
  });

  it('应该显示密码输入框', () => {
    const { getByPlaceholderText } = render(<App />);
    expect(getByPlaceholderText('密码')).toBeTruthy();
  });
});

describe('登录功能', () => {
  it('应该允许输入用户名', async () => {
    const { getByPlaceholderText } = render(<App />);
    const usernameInput = getByPlaceholderText('用户名');
    fireEvent.changeText(usernameInput, 'testuser');
    expect(usernameInput.props.value).toBe('testuser');
  });

  it('应该允许输入密码', async () => {
    const { getByPlaceholderText } = render(<App />);
    const passwordInput = getByPlaceholderText('密码');
    fireEvent.changeText(passwordInput, 'password123');
    expect(passwordInput.props.value).toBe('password123');
  });
});
