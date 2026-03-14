import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/constants/colors';

interface TimePickerProps {
  value: string; // HH:mm or ''
  onChange: (time: string) => void;
  placeholder?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function TimePicker({ value, onChange, placeholder = 'HH:mm' }: TimePickerProps) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  if (Platform.OS === 'web') {
    return (
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
    );
  }

  const openPicker = () => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      const d = new Date();
      d.setHours(h || 0, m || 0, 0, 0);
      setTempDate(d);
    } else {
      setTempDate(new Date());
    }
    setShow(true);
  };

  const confirm = () => {
    onChange(`${pad(tempDate.getHours())}:${pad(tempDate.getMinutes())}`);
    setShow(false);
  };

  if (Platform.OS === 'android') {
    return (
      <View>
        <TouchableOpacity style={styles.input} onPress={openPicker}>
          <Text style={[styles.inputText, !value && styles.placeholder]}>
            {value || placeholder}
          </Text>
        </TouchableOpacity>
        {show && (
          <DateTimePicker
            value={tempDate}
            mode="time"
            is24Hour
            display="default"
            onChange={(_, date) => {
              setShow(false);
              if (date) {
                onChange(`${pad(date.getHours())}:${pad(date.getMinutes())}`);
              }
            }}
          />
        )}
      </View>
    );
  }

  // iOS: modal overlay with spinner + OK button
  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={openPicker}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
      <Modal visible={show} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>Heure</Text>
              <TouchableOpacity onPress={confirm}>
                <Text style={styles.confirmText}>OK</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="time"
              is24Hour
              display="spinner"
              onChange={(_, date) => {
                if (date) setTempDate(date);
              }}
              style={styles.picker}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    width: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    textAlign: 'center',
  },
  placeholder: {
    color: colors.muted,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
  confirmText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.agenda.accent,
  },
  picker: {
    height: 200,
  },
});
