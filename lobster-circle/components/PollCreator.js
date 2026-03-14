/**
 * 投票创建组件
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function PollCreator({ onComplete, onCancel, darkMode }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multiple, setMultiple] = useState(false);
  const [maxChoices, setMaxChoices] = useState(1);
  const [anonymous, setAnonymous] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);

  // 添加选项
  const addOption = () => {
    if (options.length >= 10) {
      Alert.alert('提示', '最多 10 个选项');
      return;
    }
    setOptions([...options, '']);
  };

  // 删除选项
  const removeOption = (index) => {
    if (options.length <= 2) {
      Alert.alert('提示', '至少需要 2 个选项');
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  // 更新选项
  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // 创建投票
  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('提示', '请填写投票标题');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      Alert.alert('提示', '至少需要 2 个有效选项');
      return;
    }

    const pollData = {
      title: title.trim(),
      description: description.trim(),
      options: validOptions.map(text => ({ text: text.trim() })),
      settings: {
        multiple,
        maxChoices: multiple ? maxChoices : 1,
        anonymous,
        allowChange: true
      },
      expiresAt
    };

    onComplete(pollData);
  };

  return (
    <ScrollView style={[styles.container, darkMode && styles.containerDark]}>
      {/* 标题 */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, darkMode && styles.labelDark]}>投票标题 *</Text>
        <TextInput
          style={[styles.input, darkMode && styles.inputDark]}
          value={title}
          onChangeText={setTitle}
          placeholder="请输入投票标题"
          placeholderTextColor="#999"
          maxLength={200}
        />
      </View>

      {/* 描述 */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, darkMode && styles.labelDark]}>投票描述</Text>
        <TextInput
          style={[styles.textarea, darkMode && styles.inputDark]}
          value={description}
          onChangeText={setDescription}
          placeholder="可选，补充说明"
          placeholderTextColor="#999"
          maxLength={500}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* 选项 */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, darkMode && styles.labelDark]}>选项 *</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionRow}>
            <View style={styles.optionNumber}>
              <Text style={styles.optionNumberText}>{index + 1}</Text>
            </View>
            <TextInput
              style={[styles.optionInput, darkMode && styles.inputDark]}
              value={option}
              onChangeText={(value) => updateOption(index, value)}
              placeholder={`选项 ${index + 1}`}
              placeholderTextColor="#999"
              maxLength={100}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeOption(index)}
              disabled={options.length <= 2}
            >
              <Icon name="close" size={20} color={options.length <= 2 ? '#ccc' : '#ff6b6b'} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addOption}>
          <Icon name="add" size={20} color="#ff6b6b" />
          <Text style={styles.addButtonText}>添加选项</Text>
        </TouchableOpacity>
      </View>

      {/* 设置 */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, darkMode && styles.labelDark]}>投票设置</Text>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingText, darkMode && styles.settingTextDark]}>允许多选</Text>
          <Switch value={multiple} onValueChange={setMultiple} />
        </View>

        {multiple && (
          <View style={styles.settingRow}>
            <Text style={[styles.settingText, darkMode && styles.settingTextDark]}>最多可选</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setMaxChoices(Math.max(2, maxChoices - 1))}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.counterValue, darkMode && styles.settingTextDark]}>{maxChoices}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setMaxChoices(Math.min(options.length, maxChoices + 1))}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.settingRow}>
          <Text style={[styles.settingText, darkMode && styles.settingTextDark]}>匿名投票</Text>
          <Switch value={anonymous} onValueChange={setAnonymous} />
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>创建投票</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  containerDark: {
    backgroundColor: '#1a1a2e'
  },
  inputGroup: {
    marginBottom: 24
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  labelDark: {
    color: '#ccc'
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333'
  },
  inputDark: {
    backgroundColor: '#2a2a3e',
    color: '#fff'
  },
  textarea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  optionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  optionNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#333'
  },
  removeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 8,
    borderStyle: 'dashed'
  },
  addButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 4
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  settingText: {
    fontSize: 14,
    color: '#666'
  },
  settingTextDark: {
    color: '#ccc'
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  counterButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold'
  },
  counterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 12
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 32
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  createButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#ff6b6b',
    alignItems: 'center'
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
