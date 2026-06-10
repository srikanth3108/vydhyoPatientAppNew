import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  Animated,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import WebView from 'react-native-webview';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { authDelete, AuthFetch, UploadFiles } from '../../services';
import { pick } from 'react-native-document-picker';

// ─── i18n ───────────────────────────────────────────────────────────────────
type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang => {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
};
const ACCEPTED = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const localeOf = (lang: Lang) =>
  lang === 'hi' ? 'hi-IN' : lang === 'tel' ? 'te-IN' : 'en-IN';

const TR = {
  noReportsFound: {
    en: 'No medical reports found',
    hi: 'कोई मेडिकल रिपोर्ट नहीं मिली',
    tel: 'మెడికల్ రిపోర్టులు లభించలేదు',
  },
  loading: {
    en: 'Loading...',
    hi: 'लोड हो रहा है...',
    tel: 'లోడ్ అవుతోంది...',
  },
  success: { en: 'Success', hi: 'सफल', tel: 'విజయం' },
  error: { en: 'Error', hi: 'त्रुटि', tel: 'లోపం' },
  notProvided: { en: 'Not provided', hi: 'उपलब्ध नहीं', tel: 'లభ్యం కాదు' },
  unknownDoctor: {
    en: 'Unknown Doctor',
    hi: 'अज्ञात डॉक्टर',
    tel: 'తెలియని వైద్యుడు',
  },
  unknownDept: {
    en: 'Unknown Department',
    hi: 'अज्ञात विभाग',
    tel: 'తెలియని విభాగం',
  },
  medicalReports: {
    en: 'Medical Reports',
    hi: 'मेडिकल रिपोर्ट्स',
    tel: 'మెడికల్ రిపోర్టులు',
  },
  viewReport: {
    en: 'View Report',
    hi: 'रिपोर्ट देखें',
    tel: 'రిపోర్టు చూడండి',
  },
  download: { en: 'Download', hi: 'डाउनलोड', tel: 'డౌన్‌లోడ్' },
  downloaded: {
    en: 'Downloaded',
    hi: 'डाउनलोड हो गया',
    tel: 'డౌన్‌లోడ్ అయింది',
  },
  delete: { en: 'Delete', hi: 'हटाएं', tel: 'తొలగించు' },
  share: { en: 'Share', hi: 'साझा करें', tel: 'షేర్ చేయండి' },
  viewReports: {
    en: 'View Reports',
    hi: 'रिपोर्ट्स देखें',
    tel: 'రిపోర్టులు చూడండి',
  },
  familyMembers: {
    en: 'Family Members',
    hi: 'परिवार के सदस्य',
    tel: 'కుటుంబ సభ్యులు',
  },
  myFamily: { en: 'My Family', hi: 'मेरा परिवार', tel: 'నా కుటుంబం' },
  noData: { en: 'No data to display', hi: 'कोई डेटा नहीं', tel: 'డేటా లేదు' },
  errFetchMembers: {
    en: 'Failed to fetch family members',
    hi: 'परिवार के सदस्यों को प्राप्त करने में विफल',
    tel: 'కుటుంబ సభ్యులను పొందడంలో విఫలమైంది',
  },
  errFetchReports: {
    en: 'Failed to fetch reports',
    hi: 'रिपोर्ट्स प्राप्त करने में विफल',
    tel: 'రిపోర్టులు పొందడంలో విఫలమైంది',
  },
  savedToPath: {
    en: (p: string) => `Saved to ${p}`,
    hi: (p: string) => `यहाँ सेव हुआ: ${p}`,
    tel: (p: string) => `సేవ్ అయింది: ${p}`,
  },
  errDownload: {
    en: 'Failed to download file',
    hi: 'फ़ाइल डाउनलोड करने में विफल',
    tel: 'ఫైల్ డౌన్‌లోడ్ విఫలమైంది',
  },
  uploadDate: { en: 'Upload Date', hi: 'अपलोड तिथि', tel: 'అప్‌లోడ్ తేదీ' },
  close: { en: 'Close', hi: 'बंद करें', tel: 'మూసివేయి' },
  noAppointments: {
    en: 'No appointments found',
    hi: 'कोई नियुक्ति नहीं मिली',
    tel: 'అపాయింట్మెంట్లు లభించలేదు',
  },
};

// ─── helpers ────────────────────────────────────────────────────────────────
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
};

const TYPE_LABEL: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'DOCX',
};

const isImage = (mime: string) => mime?.startsWith('image/');
const isPdf = (mime: string) => mime === 'application/pdf';
const isWord = (mime: string) =>
  mime === 'application/msword' ||
  mime ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const getTypeLabel = (mime: string) => TYPE_LABEL[mime] ?? 'FILE';

const formatFileSize = (bytes: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const sanitizeFileName = (name: string): string =>
  name
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

const getFileExtension = (url: string) => {
  const match = url?.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1] : '';
};

const buildDownloadPath = (file: {
  originalName?: string;
  fileType?: string;
  fileUrl?: string;
}): string => {
  const mimeExt = file.fileType ? MIME_TO_EXT[file.fileType] : undefined;
  const urlExt = file.fileUrl ? getFileExtension(file.fileUrl) : '';
  let baseName = file.originalName
    ? sanitizeFileName(file.originalName)
    : `document_${Date.now()}`;
  const dotIdx = baseName.lastIndexOf('.');
  const baseWithoutExt = dotIdx > 0 ? baseName.substring(0, dotIdx) : baseName;
  const ext = mimeExt || urlExt || 'file';
  const finalName = `${baseWithoutExt}.${ext}`;
  const dir =
    Platform.OS === 'android'
      ? RNFS.DownloadDirectoryPath
      : RNFS.DocumentDirectoryPath;
  return `${dir}/${finalName}`;
};

// ─── Avatar color palette ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#FDE8EE', text: '#C2185B', accent: '#E91E63' },
  { bg: '#E3F2FD', text: '#1565C0', accent: '#2196F3' },
  { bg: '#EDE7F6', text: '#6A1B9A', accent: '#9C27B0' },
  { bg: '#E8F5E9', text: '#2E7D32', accent: '#4CAF50' },
  { bg: '#FFF3E0', text: '#E65100', accent: '#FF9800' },
  { bg: '#E0F7FA', text: '#00838F', accent: '#00BCD4' },
];

const getAvatarColor = (name: string) => {
  const idx = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[idx];
};

const getInitials = (name: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString: string, lang: Lang) => {
  if (!dateString) return TR.notProvided[lang];
  return new Date(dateString).toLocaleDateString(localeOf(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// ─── DownloadToast ───────────────────────────────────────────────────────────
interface DownloadToastProps {
  visible: boolean;
  fileName: string;
  status: 'downloading' | 'success' | 'error';
}

const DownloadToast: React.FC<DownloadToastProps> = ({
  visible,
  fileName,
  status,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const bgColor =
    status === 'success'
      ? '#0D3321'
      : status === 'error'
      ? '#3D1C1C'
      : '#1A1A2E';
  const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⬇️';
  const label =
    status === 'success'
      ? 'Downloaded successfully'
      : status === 'error'
      ? 'Download failed'
      : 'Downloading…';

  return (
    <Animated.View
      style={[
        toastSt.container,
        { backgroundColor: bgColor, transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <Text style={toastSt.icon}>{icon}</Text>
      <View style={toastSt.textWrap}>
        <Text style={toastSt.label}>{label}</Text>
        <Text style={toastSt.fileName} numberOfLines={1}>
          {fileName}
        </Text>
      </View>
      {status === 'downloading' && (
        <ActivityIndicator color="#fff" size="small" />
      )}
    </Animated.View>
  );
};

const toastSt = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  icon: { fontSize: 20 },
  textWrap: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#fff' },
  fileName: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
});

// ─── PreviewContent (no react-native-pdf) ───────────────────────────────────
interface PreviewContentProps {
  fileType: string;
  fileUrl?: string;
  fileName?: string;
}

const PreviewContent: React.FC<PreviewContentProps> = ({
  fileType,
  fileUrl,
  fileName,
}) => {
  const [webviewLoading, setWebviewLoading] = useState(true);

  // ── Image ──
  if (isImage(fileType) && fileUrl) {
    return (
      <Image source={{ uri: fileUrl }} style={pSt.img} resizeMode="contain" />
    );
  }

  // ── PDF via Google Docs viewer (no native PDF package needed) ──
  if (isPdf(fileType) && fileUrl) {
    const googleViewer = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
      fileUrl,
    )}`;
    return (
      <View style={pSt.webviewWrap}>
        {webviewLoading && (
          <View style={pSt.webviewLoader}>
            <ActivityIndicator size="large" color="#4A6FA5" />
            <Text style={pSt.webviewLoaderText}>Loading PDF…</Text>
          </View>
        )}
        <WebView
          source={{ uri: googleViewer }}
          style={[pSt.webview, webviewLoading && { opacity: 0 }]}
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() => setWebviewLoading(false)}
        />
      </View>
    );
  }

  // ── Word doc via Google Docs viewer ──
  if (isWord(fileType) && fileUrl) {
    const googleViewer = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
      fileUrl,
    )}`;
    return (
      <View style={pSt.webviewWrap}>
        {webviewLoading && (
          <View style={pSt.webviewLoader}>
            <ActivityIndicator size="large" color="#4A6FA5" />
            <Text style={pSt.webviewLoaderText}>Loading document…</Text>
          </View>
        )}
        <WebView
          source={{ uri: googleViewer }}
          style={[pSt.webview, webviewLoading && { opacity: 0 }]}
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() => setWebviewLoading(false)}
        />
      </View>
    );
  }

  // ── Fallback ──
  return (
    <View style={pSt.placeholder}>
      <Text style={pSt.plIcon}>📁</Text>
      <Text style={pSt.plTitle}>{fileName || 'Document'}</Text>
      <Text style={pSt.plText}>
        Preview not available{'\n'}Download to view this file
      </Text>
    </View>
  );
};

const pSt = StyleSheet.create({
  img: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: '#F0F4FF',
  },
  webviewWrap: {
    height: 460,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F4FF',
    position: 'relative',
  },
  webview: { flex: 1, width: '100%', height: '100%' },
  webviewLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10,
    backgroundColor: '#F0F4FF',
  },
  webviewLoaderText: { fontSize: 13, color: '#7A8FA6', fontWeight: '500' },
  placeholder: {
    height: 180,
    borderRadius: 10,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  plIcon: { fontSize: 44 },
  plTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A4A5C',
    textAlign: 'center',
  },
  plText: {
    fontSize: 12,
    color: '#7A8FA6',
    textAlign: 'center',
    lineHeight: 18,
  },
});

// ─── Main Component ──────────────────────────────────────────────────────────
const MyFamily = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(currentuserDetails?.appLanguage);
  const t = (k: keyof typeof TR, ...args: any[]) => {
    const val = TR[k][lang as Lang] as any;
    return typeof val === 'function' ? val(...args) : val;
  };

  const [stagedFiles, setStagedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  // screens: 'family' | 'medicalReports' | 'reportPreview'
  const [currentScreen, setCurrentScreen] = useState('family');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [myselfData, setMyselfData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // preview modal
  const [preview, setPreview] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // download toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastFileName, setToastFileName] = useState('');
  const [toastStatus, setToastStatus] = useState<
    'downloading' | 'success' | 'error'
  >('downloading');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showDlToast = (
    fileName: string,
    status: 'downloading' | 'success' | 'error',
    autoDismiss?: number,
  ) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastFileName(fileName);
    setToastStatus(status);
    setToastVisible(true);
    if (autoDismiss)
      toastTimerRef.current = setTimeout(
        () => setToastVisible(false),
        autoDismiss,
      );
  };

  // ── fetch family members ──
  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response = await AuthFetch(
        `doctor/getAllFamilyMembers?userId=${currentuserDetails.userId}`,
        token,
      );
      if (response?.data?.status === 'success') {
        const list = response.data.data;
        setFamilyMembers(
          list.filter((u: any) => u.relationship?.toLowerCase() !== 'self'),
        );
        setMyselfData(
          list.find((u: any) => u.relationship?.toLowerCase() === 'self') ||
            null,
        );
      } else {
        Toast.show({
          type: 'error',
          text1: t('error'),
          text2: t('errFetchMembers'),
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('errFetchMembers'),
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // const [currentPage, setCurrentPage] = useState(1);
  // const [totalPages, setTotalPages] = useState(1);
  // const [totalDocs, setTotalDocs] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const LIMIT = 10;

  const fetchReports = async (patientId: string, page: number = 1) => {
    try {
      setLoadingReports(true);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const res = await AuthFetch(
        `documents/getdocumentsByPatientId/${patientId}?page=${page}&limit=${LIMIT}`,
        token,
      );
      console.log('Fetching reports:', res);
      const responseData = res?.data;
      console.log('Response data:lol', responseData);

      if (res?.status === 'success') {
        setReports(responseData?.data || []);

        setCurrentPage(responseData?.pagination?.currentPage || 1);
        setTotalPages(responseData?.pagination?.totalPages || 1);
        setTotalDocs(responseData?.pagination?.totalDocuments || 0);
        setHasNextPage(responseData?.pagination?.hasNextPage || false);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.log(err);
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, [lang]);

  const handleMemberPress = (member: any) => {
    setSelectedMember(member);
    fetchReports(member.userId, 1);
    setCurrentScreen('medicalReports');
  };

  const handleBack = () => {
    if (currentScreen === 'medicalReports') {
      setCurrentScreen('family');
      setSelectedMember(null);
      setReports([]);
    } else {
      navigation.goBack();
    }
  };

  // ── download ──
  const handleDownload = async (file: any) => {
    if (!file?.fileUrl) {
      Alert.alert('Error', 'File URL not available');
      return;
    }
    const downloadPath = buildDownloadPath({
      originalName: file.originalName,
      fileType: file.fileType,
      fileUrl: file.fileUrl,
    });
    const displayName = file.originalName || downloadPath.split('/').pop()!;
    showDlToast(displayName, 'downloading');
    try {
      const dir = downloadPath.substring(0, downloadPath.lastIndexOf('/'));
      if (!(await RNFS.exists(dir))) await RNFS.mkdir(dir);
      if (await RNFS.exists(downloadPath)) await RNFS.unlink(downloadPath);
      const result = await RNFS.downloadFile({
        fromUrl: file.fileUrl,
        toFile: downloadPath,
        background: true,
        discretionary: true,
      }).promise;
      if (result.statusCode === 200) {
        showDlToast(displayName, 'success', 3500);
        if (Platform.OS === 'android') {
          try {
            await RNFS.scanFile(downloadPath);
          } catch {}
        }
      } else {
        showDlToast(displayName, 'error', 3000);
        Alert.alert(
          'Download Error',
          `Server returned status ${result.statusCode}.`,
        );
      }
    } catch (error: any) {
      showDlToast(displayName, 'error', 3000);
      const msg =
        error?.message?.includes('ENOENT') ||
        error?.message?.includes('no such file')
          ? 'Could not create the file. Check storage permissions.'
          : error?.message || 'Unable to download file.';
      Alert.alert('Download Failed', msg);
    }
  };

  // ─── Pick Multiple Files ───
  const pickFiles = async () => {
    const MAX_FILES = 10;
    try {
      const res = await pick({
        type: [types.allFiles],
        allowMultiSelection: true,
      });

      const valid: any[] = [];
      const skipped: string[] = [];

      res.forEach((f: any) => {
        if (!ACCEPTED.includes(f.type ?? '')) {
          skipped.push(`${f.name} (unsupported)`);
          return;
        }
        if ((f.size ?? 0) > MAX_FILE_SIZE) {
          skipped.push(`${f.name} (> 3MB)`);
          return;
        }
        // valid.push({ id: `${Date.now()}-${Math.random()}`, file: f });
        valid.push({
          id: `${Date.now()}-${Math.random()}`,
          file: f,

          // preview compatible structure
          fileUrl: f.uri,
          fileType: f.type,
          originalName: f.name,
          fileSize: f.size,
          isLocal: true,
        });
      });

      // Existing files + newly selected files
      const totalFiles = [...stagedFiles, ...res];

      if (totalFiles.length > MAX_FILES) {
        Alert.alert(
          'Limit exceeded',
          `You can upload a maximum of ${MAX_FILES} documents at a time`,
        );

        return;
      }

      if (skipped.length > 0) {
        Alert.alert(
          'Some files skipped',
          skipped.join('\n') + '\n\nMax 3MB | JPG, PNG, PDF, DOC, DOCX only',
        );
      }

      if (valid.length > 0) {
        setStagedFiles(prev => [...prev, ...valid]);
      }
    } catch (err: any) {
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') return;
      Alert.alert('Error', 'Failed to select files');
    }
  };

  // ─── Upload Staged Files ───
  const handleUpload2 = async () => {
    if (!stagedFiles.length || !selectedMember?.userId) return;

    setUploading(true);
    const formData = new FormData();

    stagedFiles.forEach(item => {
      formData.append('files', {
        uri: item.file.uri,
        name: item.file.name,
        type: item.file.type,
      } as any);
    });

    formData.append('patientId', selectedMember.userId);

    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await UploadFiles(
        'documents/upload-documents',
        formData,
        token,
      );

      if (res?.status === 'success') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Reports uploaded successfully!',
        });
        setStagedFiles([]);
        fetchReports(selectedMember.userId, 1);
      } else {
        Alert.alert('Error', 'Upload failed');
      }
    } catch (err) {
      Alert.alert('Error', 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── upload ──
  const handleUpload = async () => {
    if (!stagedFiles.length) return;
    setUploading(true);
    const formData = new FormData();
    stagedFiles.forEach(item => {
      formData.append('files', {
        uri: item.file.uri,
        name: item.file.name,
        type: item.file.type,
      } as any);
    });
    formData.append('patientId', selectedMember.userId);

    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      console.log('Uploading files with token:', storedToken);
      const res = await UploadFiles(
        'documents/upload-documents',
        formData,
        storedToken,
      );
      console.log('Upload response:', res);
      if (res.status === 'success') {
        Alert.alert('Success', 'Files uploaded successfully');
        setStagedFiles([]);
        fetchReports(selectedMember.userId, 1);
      } else {
        Alert.alert('Error', 'Upload failed');
      }
    } catch {
      Alert.alert('Error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FAMILY SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  const FamilyScreen = () => {
    const allMembers = [
      ...(myselfData
        ? [{ ...myselfData, relationship: 'Self', isSelf: true }]
        : []),
      ...familyMembers,
    ];

    return (
      <SafeAreaView style={s.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F7FF" />

        {/* Header */}
        {/* <View style={s.topHeader}>
          <View>
            <Text style={s.topHeaderTitle}>{t('myFamily')}</Text>
            <Text style={s.topHeaderSub}>
              {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>👨‍👩‍👧‍👦</Text>
          </View>
        </View> */}
        {/* Header */}
        <View style={s.screenHeader}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={s.screenHeaderCenter}>
            <Text style={s.screenHeaderTitle}>{t('medicalReports')}</Text>
            <Text style={s.screenHeaderSub}>
              {selectedMember?.firstname} {selectedMember?.lastname || ''}
            </Text>
          </View>

          {/* Upload Button */}
        </View>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={s.loaderWrap}>
              <ActivityIndicator size="large" color="#4A6FA5" />
              <Text style={s.loaderText}>{t('loading')}</Text>
            </View>
          ) : allMembers.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyIcon}>👤</Text>
              <Text style={s.emptyTitle}>{t('noData')}</Text>
            </View>
          ) : (
            allMembers.map((member, idx) => {
              const color = getAvatarColor(member.firstname || '');
              return (
                <TouchableOpacity
                  key={`${member.userId}-${idx}`}
                  style={[s.memberCard, member.isSelf && s.selfCard]}
                  onPress={() => handleMemberPress(member)}
                  activeOpacity={0.85}
                >
                  {/* Left accent bar */}
                  <View
                    style={[s.memberAccent, { backgroundColor: color.accent }]}
                  />

                  {/* Avatar */}
                  <View style={[s.avatar, { backgroundColor: color.bg }]}>
                    <Text style={[s.avatarText, { color: color.text }]}>
                      {getInitials(member.firstname)}
                    </Text>
                    {member.isSelf && (
                      <View
                        style={[s.selfDot, { backgroundColor: color.accent }]}
                      />
                    )}
                  </View>

                  {/* Info */}
                  <View style={s.memberInfoWrap}>
                    <View style={s.memberNameRow}>
                      <Text style={s.memberName}>
                        {member.firstname} {member.lastname || ''}
                      </Text>
                      {member.isSelf && (
                        <View
                          style={[
                            s.selfPill,
                            {
                              backgroundColor: color.bg,
                              borderColor: color.accent,
                            },
                          ]}
                        >
                          <Text style={[s.selfPillText, { color: color.text }]}>
                            You
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.memberRelation}>{member.relationship}</Text>
                    {member.mobile ? (
                      <Text style={s.memberPhone}>📞 {member.mobile}</Text>
                    ) : null}
                  </View>

                  {/* Right caret + reports pill */}
                  <View style={s.memberRight}>
                    <View
                      style={[s.reportsPill, { backgroundColor: color.bg }]}
                    >
                      <Text style={[s.reportsPillText, { color: color.text }]}>
                        📋 {t('viewReports')}
                      </Text>
                    </View>
                    <Text style={[s.caret, { color: color.accent }]}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* bottom padding */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MEDICAL REPORTS SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  const MedicalReportsScreen = () => {
    const color = getAvatarColor(selectedMember?.firstname || '');
    // const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE);
    // console.log('sos', totalPages);
    // console.log('sos', reports.length);

    // const paginatedReports = reports.slice(
    //   (currentPage - 1) * ITEMS_PER_PAGE,
    //   currentPage * ITEMS_PER_PAGE,
    // );

    // ── delete ──
    const handleDelete = async () => {
      // console.log("Deleting report with ID:", deleteTargetID);
      if (!deleteTarget._id) return;
      // try {
      //   const storedToken = await AsyncStorage.getItem('authToken');
      //   const res = await authDelete(
      //     `documents/deleteDocument/${deleteTarget._id}`,
      //     {},
      //     storedToken,
      //   );
      //   if (res.status === 'success') {
      //     setReports(p => p.filter(r => r._id !== deleteTarget._id));
      //     setDeleteTarget(null);
      //   }
      // } catch {
      //   Alert.alert('Error', 'Delete failed');
      // }
    };

    return (
      <SafeAreaView style={s.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F7FF" />
        <DownloadToast
          visible={toastVisible}
          fileName={toastFileName}
          status={toastStatus}
        />

        {/* Header */}
        <View style={s.screenHeader}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={s.screenHeaderCenter}>
            <Text style={s.screenHeaderTitle}>{t('medicalReports')}</Text>
            <Text style={s.screenHeaderSub}>
              {selectedMember?.firstname} {selectedMember?.lastname || ''}
            </Text>
          </View>
          <View style={[s.miniAvatar, { backgroundColor: color.bg }]}>
            <Text style={[s.miniAvatarText, { color: color.text }]}>
              {getInitials(selectedMember?.firstname)}
            </Text>
          </View>
        </View>

        {/* Staged Files (Pending Upload) */}
        {stagedFiles.length > 0 && (
          <View style={s.stagedArea}>
            <Text style={s.stagedLabel}>
              Pending Upload • {stagedFiles.length} file
              {stagedFiles.length > 1 ? 's' : ''}
            </Text>

            <ScrollView
              style={s.stagedScroll}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {stagedFiles.map(item => (
                <View key={item.id} style={s.stagedFile}>
                  <View style={s.stagedFileMeta}>
                    <Text style={s.stagedFileIcon}>
                      {isImage(item.file.type)
                        ? '🖼'
                        : isPdf(item.file.type)
                        ? '📄'
                        : '📝'}
                    </Text>

                    <View style={{ flex: 1 }}>
                      <Text style={s.stagedFileName} numberOfLines={1}>
                        {item.file.name}
                      </Text>

                      <Text style={s.stagedFileSize}>
                        {formatFileSize(item.file.size)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setStagedFiles(p => p.filter(f => f.id !== item.id))
                    }
                  >
                    <Text style={s.stagedRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={s.stagedActions}>
              <TouchableOpacity
                style={s.btnGhost}
                onPress={() => setStagedFiles([])}
              >
                <Text style={s.btnGhostTxt2}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.btnPrimary}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.btnPrimaryTxt}>Upload All</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content */}
        {loadingReports ? (
          <View style={s.loaderWrap}>
            <ActivityIndicator size="large" color="#4A6FA5" />
            <Text style={s.loaderText}>{t('loading')}</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>🗂️</Text>
            <Text style={s.emptyTitle}>{t('noReportsFound')}</Text>
            <Text style={s.emptySub}>No documents uploaded yet</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={s.reportsGrid}
            showsVerticalScrollIndicator={false}
          >
            {reports?.map((report, idx) => {
              const img = isImage(report.fileType);
              const pdf = isPdf(report.fileType);
              const word = isWord(report.fileType);
              const fileIcon = img ? '🖼' : pdf ? '📄' : word ? '📝' : '📁';
              const typeLabel = getTypeLabel(report.fileType);

              return (
                <View key={`${report._id}-${idx}`} style={s.reportCard}>
                  {/* Thumbnail */}
                  <TouchableOpacity
                    style={s.reportThumb}
                    onPress={() => setPreview(report)}
                    activeOpacity={0.85}
                  >
                    {img ? (
                      <Image
                        source={{ uri: report.fileUrl }}
                        style={s.reportThumbImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={s.reportThumbPlaceholder}>
                        <Text style={s.reportThumbIcon}>{fileIcon}</Text>
                      </View>
                    )}
                    <View style={s.typeBadge}>
                      <Text style={s.typeBadgeText}>{typeLabel}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Info */}
                  <View style={s.reportBody}>
                    <Text style={s.reportName} numberOfLines={1}>
                      {report.originalName || 'Document'}
                    </Text>
                    <Text style={s.reportDate}>
                      {formatDate(report.createdAt, lang)}
                    </Text>
                    {report.fileSize ? (
                      <Text style={s.reportSize}>
                        {formatFileSize(report.fileSize)}
                      </Text>
                    ) : null}
                  </View>

                  {/* Actions */}
                  <View style={s.reportActions}>
                    <TouchableOpacity
                      style={s.actionView}
                      onPress={() => setPreview(report)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.actionViewText}>View</Text>
                    </TouchableOpacity>
                    <View style={s.actionDivider} />

                    <TouchableOpacity
                      style={s.actionDownload}
                      onPress={() => handleDownload(report)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.actionDownloadIcon}>⬇</Text>
                      <Text style={s.actionDownloadText}>Save</Text>
                    </TouchableOpacity>

                    <View style={s.actionDivider} />

                    <TouchableOpacity
                      style={s.actionView}
                      onPress={() => setDeleteTarget(report)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.delViewText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {/* <View style={{ height: 32 }} /> */}
            <View style={{ height: 12 }} />

            <View style={s.paginationContainer}>
              <TouchableOpacity
                style={[s.pageButton, currentPage === 1 && s.disabledButton]}
                disabled={currentPage <= 1}
                onPress={() =>
                  fetchReports(selectedMember.userId, currentPage - 1)
                }
              >
                <Text style={s.pageButtonText}>Prev</Text>
              </TouchableOpacity>

              <View>
                <Text style={s.pageIndicator}>
                  {currentPage} / {totalPages}
                </Text>

                <Text style={s.totalDocs}>{totalDocs} Documents</Text>
              </View>

              <TouchableOpacity
                style={[
                  s.pageButton,
                  currentPage === totalPages && s.disabledButton,
                ]}
                disabled={currentPage === totalPages}
                onPress={() =>
                  fetchReports(selectedMember.userId, currentPage + 1)
                }
              >
                <Text style={s.pageButtonText}>Next</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 50 }} />

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ═══════════ DELETE MODAL ═══════════ */}
        <Modal visible={!!deleteTarget} transparent animationType="fade">
          <View style={s.modalOverlay}>
            <View style={s.modal}>
              {/* Header */}
              <View style={s.modalHeader}>
                <Text style={s.modalHeaderTitle}>Delete Document</Text>
                <Pressable
                  style={s.modalCloseBtn}
                  onPress={() => setDeleteTarget(null)}
                >
                  <Text style={{ fontSize: 14, color: '#5F5E5A' }}>✕</Text>
                </Pressable>
              </View>

              {/* Body */}
              <View style={s.delModalBody}>
                <View style={s.delIconRing}>
                  <View style={s.delIconInner}>
                    <Text style={{ fontSize: 22 }}>🗑️</Text>
                  </View>
                </View>

                <Text style={s.delTitle}>Permanently delete?</Text>
                <Text style={s.delDesc}>
                  This will permanently delete{' '}
                  <Text style={s.delFileName}>
                    "{deleteTarget?.originalName}"
                  </Text>
                  . This action cannot be undone.
                </Text>

                {deleteTarget && (
                  <View style={s.delFilePill}>
                    <Text style={s.delFilePillIcon}>
                      {isImage(deleteTarget.fileType)
                        ? '🖼'
                        : isPdf(deleteTarget.fileType)
                        ? '📄'
                        : isWord(deleteTarget.fileType)
                        ? '📝'
                        : '📁'}
                    </Text>
                    <Text style={s.delFilePillName} numberOfLines={1}>
                      {deleteTarget.originalName}
                    </Text>
                    <View style={s.delFilePillBadge}>
                      <Text style={s.delFilePillBadgeText}>
                        {getTypeLabel(deleteTarget.fileType)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={s.delFooter}>
                <Pressable
                  style={[s.btnGhost, { flex: 1 }]}
                  onPress={() => setDeleteTarget(null)}
                >
                  <Text style={s.btnGhostText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[s.btnDanger, { flex: 1 }]}
                  onPress={handleDelete}
                >
                  <Text style={s.btnDangerText}>🗑️ Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Preview Modal */}
        <Modal
          visible={!!preview}
          transparent
          animationType="slide"
          onRequestClose={() => setPreview(null)}
        >
          <View style={s.modalOverlay}>
            <View style={[s.modal, { maxHeight: '92%' }]}>
              {/* Modal Header */}
              <View style={s.modalHeader}>
                <View style={s.modalHeaderLeft}>
                  <View style={s.modalTypeBadge}>
                    <Text style={s.modalTypeBadgeText}>
                      {getTypeLabel(preview?.fileType ?? '')}
                    </Text>
                  </View>
                  <Text style={s.modalHeaderTitle} numberOfLines={1}>
                    {preview?.originalName || 'Document'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.modalCloseBtn}
                  onPress={() => setPreview(null)}
                >
                  <Text style={s.modalCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <ScrollView
                style={s.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <PreviewContent
                  fileType={preview?.fileType ?? ''}
                  fileUrl={preview?.fileUrl}
                  fileName={preview?.originalName}
                />
              </ScrollView>

              {/* Modal Footer */}
              <View style={s.modalFooter}>
                <TouchableOpacity
                  style={s.modalBtnGhost}
                  onPress={() => setPreview(null)}
                >
                  <Text style={s.modalBtnGhostTxt}>{t('close')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.modalBtnPrimary}
                  onPress={() => {
                    setPreview(null);
                    handleDownload(preview);
                  }}
                >
                  <Text style={s.modalBtnPrimaryTxt}>⬇️ {t('download')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={s.addBtn} onPress={pickFiles}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  };

  // ─── Router ──────────────────────────────────────────────────────────────
  switch (currentScreen) {
    case 'medicalReports':
      return <MedicalReportsScreen />;
    default:
      return <FamilyScreen />;
  }
};

export default MyFamily;

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },

  // ── Top Header (Family screen) ──
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F7FF',
  },
  topHeaderTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A2340',
    letterSpacing: -0.5,
  },
  topHeaderSub: {
    fontSize: 13,
    color: '#7A8FA6',
    marginTop: 2,
    fontWeight: '400',
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A6FA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  headerBadgeText: { fontSize: 22 },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // ── Loader / Empty ──
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loaderText: { fontSize: 14, color: '#7A8FA6', fontWeight: '400' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#3A4A5C' },
  emptySub: { fontSize: 13, color: '#7A8FA6', marginTop: 2 },

  // ── Member Card ──
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#4A6FA5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  selfCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(74,111,165,0.2)',
  },
  memberAccent: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginVertical: 14,
    position: 'relative',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  selfDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberInfoWrap: {
    flex: 1,
    paddingLeft: 12,
    paddingVertical: 14,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2340',
    letterSpacing: -0.2,
  },
  selfPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  selfPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  memberRelation: {
    fontSize: 12,
    color: '#7A8FA6',
    marginTop: 2,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  memberPhone: { fontSize: 12, color: '#9AAABB', marginTop: 3 },
  memberRight: {
    paddingRight: 12,
    alignItems: 'flex-end',
    gap: 6,
    paddingVertical: 14,
  },
  reportsPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  reportsPillText: { fontSize: 11, fontWeight: '600' },
  caret: { fontSize: 24, fontWeight: '300' },

  // ── Screen Header (Reports screen) ──
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#F5F7FF',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backArrow: { fontSize: 26, color: '#1A2340', lineHeight: 30 },
  screenHeaderCenter: { flex: 1 },
  screenHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2340',
    letterSpacing: -0.3,
  },
  screenHeaderSub: { fontSize: 12, color: '#7A8FA6', marginTop: 1 },
  miniAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: { fontSize: 14, fontWeight: '700' },

  // ── Stats bar ──
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#4A6FA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#1A2340' },
  statLabel: {
    fontSize: 11,
    color: '#7A8FA6',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: { width: 1, backgroundColor: '#E8EDF5', marginVertical: 4 },

  // ── Reports grid ──
  reportsGrid: {
    paddingHorizontal: 12,
    paddingTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // ── Report Card ──
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#4A6FA5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',

    // 👇 ADD THIS
    width: '48%',
  },
  reportThumb: {
    height: 140,
    backgroundColor: '#EEF1FB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  reportThumbImg: { width: '100%', height: '100%' },
  reportThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  reportThumbIcon: { fontSize: 52 },
  typeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3A4A5C',
    letterSpacing: 0.5,
  },
  reportBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  reportName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2340',
    marginBottom: 3,
  },
  reportDate: { fontSize: 12, color: '#7A8FA6' },
  reportSize: { fontSize: 11, color: '#9AAABB', marginTop: 2 },

  reportActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEF1FB',
  },
  actionView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
  },
  actionViewIcon: { fontSize: 14 },
  actionViewText: { fontSize: 13, fontWeight: '600', color: '#4A6FA5' },
  delViewText: { fontSize: 13, fontWeight: '600', color: '#d63e3eff' },
  actionDivider: { width: 1, backgroundColor: '#EEF1FB' },
  actionDownload: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
  },
  actionDownloadIcon: { fontSize: 14 },
  actionDownloadText: { fontSize: 13, fontWeight: '600', color: '#27834B' },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,15,30,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1FB',
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  modalTypeBadge: {
    backgroundColor: '#EEF1FB',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  modalTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4A6FA5',
    letterSpacing: 0.5,
  },
  modalHeaderTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2340',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseTxt: { fontSize: 12, color: '#5F6E82' },
  modalBody: { padding: 14 },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF1FB',
  },
  modalBtnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C5D0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnGhostTxt: { fontSize: 14, fontWeight: '500', color: '#5F6E82' },
  btnGhostTxt2: { fontSize: 14, fontWeight: '500', color: '#060707ff' },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4A6FA5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimaryTxt: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  addBtn: {
    position: 'absolute',
    bottom: 85,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070707',
    // subtle glowing ring
    borderWidth: 1.5,
    borderColor: 'rgba(174,238,211,0.35)',
    // iOS shadow
    shadowColor: '#AEEED3',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 14,

    // Android
    elevation: 14,

    zIndex: 999,

    // extra depth
    transform: [{ scale: 1 }],
  },
  addBtnText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
  },

  stagedArea: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    borderRadius: 12,
  },

  stagedScroll: {
    maxHeight: 250, // limits height when many files exist
  },

  stagedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A6FA5',
    marginBottom: 10,
  },
  stagedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  stagedFileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  stagedFileIcon: { fontSize: 26 },
  stagedFileName: { fontSize: 14, fontWeight: '500', color: '#777' },
  stagedFileSize: { fontSize: 12, color: '#777' },
  stagedRemove: { fontSize: 20, color: '#e74c3c', paddingLeft: 8 },

  stagedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },

  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4A6FA5',
    alignItems: 'center',
  },
  btnPrimaryTxt: { color: '#fff', fontWeight: '600' },

  // Delete modal
  delModalBody: {
    padding: 20,
    alignItems: 'flex-start',
  },
  delIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FEE4E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  delIconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCEBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A18',
    marginBottom: 6,
  },
  delDesc: { fontSize: 13, color: '#888780', lineHeight: 20, marginBottom: 14 },
  delFileName: { fontWeight: '500', color: '#5F5E5A' },
  delFilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F8F6',
    borderWidth: 0.5,
    borderColor: '#D3D1C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    width: '100%',
  },
  delFilePillIcon: { fontSize: 16 },
  delFilePillName: {
    flex: 1,
    fontSize: 12,
    color: '#1A1A18',
    fontWeight: '500',
  },
  delFilePillBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#B4B2A9',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  delFilePillBadgeText: { fontSize: 9, fontWeight: '600', color: '#5F5E5A' },
  delFooter: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#D3D1C7',
  },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCEBEB',
    borderWidth: 0.5,
    borderColor: '#F7C1C1',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  btnDangerText: { fontSize: 13, fontWeight: '600', color: '#A32D2D' },
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: '#B4B2A9',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  btnGhostText: { fontSize: 13, color: '#5F5E5A' },

  paginationContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 16,
  },

  pageButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  disabledButton: {
    opacity: 0.4,
  },

  pageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  pageIndicator: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2340',
    textAlign: 'center',
  },

  totalDocs: {
    fontSize: 11,
    color: '#7A8FA6',
    textAlign: 'center',
    marginTop: 2,
  },
});