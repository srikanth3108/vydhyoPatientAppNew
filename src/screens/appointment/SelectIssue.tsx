import React, { useState, useEffect } from 'react';
import { AuthFetch, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
;
import { useSelector } from 'react-redux';

// Import responsive utilities
import {
  isTablet,
  isSmallDevice,
  SPACING,
  LAYOUT,
  responsiveWidth,
  moderateScale,
  SAFE_AREA,
} from '../../utils/responsive';

type Lang = 'en' | 'hi' | 'tel';

interface Specialty {
  id: string;
  name: string; // canonical English name (unchanged)
  displayName: string; // commonName from API for display
  image: any;
}

interface ApiSpecialization {
  _id: string;
  specializationsId: string;
  name: string;
  aliasName: string;
  commonName?: string;
  isActive: number;
  image: string | null;
  createdTime: string;
  updatedTime: string;
  __v: number;
  imageUrl?: string;
}

interface SelectIssueProps {
  navigation: StackNavigationProp<RootStackParamList, 'SelectIssue'>;
}

/** ---- UI strings per language ---- */
const UI = {
  title: {
    en: 'Select Issue',
    hi: 'समस्या चुनें',
    tel: 'సమస్యను ఎంచుకోండి',
  },
  searchPlaceholder: {
    en: 'Search Specialization...',
    hi: 'खोजें...',
    tel: 'వెతకండి...',
  },
  sectionSpecialities: {
    en: 'Specialities',
    hi: 'विशेषताएँ',
    tel: 'ప్రత్యేకతలు',
  },
  sectionSuperSpecialities: {
    en: 'Super Specialities',
    hi: 'सुपर विशेषताएँ',
    tel: 'సూపర్ ప్రత్యేకతలు',
  },
  loading: {
    en: 'Loading specializations...',
    hi: 'विशेषताएँ लोड हो रही हैं...',
    tel: 'ప్రత్యేకతలు లోడ్ అవుతున్నాయి...',
  },
} as const;

/** ---- Display translations for specialty names (fallback to English) ---- */
const NAME_T: Record<
  string,
  Partial<Record<Lang, string>> & { en: string }
> = {
  // --- Specialities ---
  'General Medicine': { en: 'General Medicine', hi: 'सामान्य चिकित्सा', tel: 'ఫిజీషియన్' },
  'Internal Medicine': { en: 'Internal Medicine', hi: 'आंतरिक चिकित्सा', tel: 'అంతర్గత వైద్యం' },
  Pediatrics: { en: 'Pediatrics', hi: 'बाल चिकित्सा', tel: 'శిశు వైద్యం' },
  'Obstetrics and Gynaecology': {
    en: 'Obstetrics and Gynaecology',
    hi: 'प्रसूति एवं स्त्री रोग',
    tel: 'ప్రసూతి & గైనకాలజీ',
  },
  'General Surgery': { en: 'General Surgery', hi: 'सामान्य शल्य चिकित्सा', tel: 'సాధారణ శస్త్రచికిత్స' },
  'Family Medicine': { en: 'Family Medicine', hi: 'परिवार चिकित्सा', tel: 'కుటుంబ వైద్యం' },
  'Emergency Medicine': { en: 'Emergency Medicine', hi: 'आपातकालीन चिकित्सा', tel: 'ఎమర్జెన్సీ మెడిసిన్' },
  'Geriatrics / Geriatric Medicine': {
    en: 'Geriatrics / Geriatric Medicine',
    hi: 'जराचिकित्सा',
    tel: 'వృద్ధుల వైద్యం',
  },
  'Respiratory Medicine / Pulmonary & Critical Care Medicine': {
    en: 'Respiratory / Pulmonary & Critical Care',
    hi: 'श्वसन / पल्मोनरी एवं क्रिटिकल केयर',
    tel: 'శ్వాసకోశ / పల్మనరీ & క్రిటికల్ కేర్',
  },
  'Psychiatry / Psychological Medicine': {
    en: 'Psychiatry / Psychological Medicine',
    hi: 'मनोचिकित्सा',
    tel: 'మానసిక వైద్యం',
  },
  'Dermatology, Venereology & Leprosy': {
    en: 'Dermatology, Venereology & Leprosy',
    hi: 'त्वचा, यौन रोग एवं कुष्ठ',
    tel: 'చర్మం, వేనీరియల్ & కుష్ఠు',
  },
  'Community Medicine': { en: 'Community Medicine', hi: 'समुदाय चिकित्सा', tel: 'సముదాయ వైద్యం' },
  'Public Health / Public Health Dentistry': {
    en: 'Public Health / Public Health Dentistry',
    hi: 'लोक स्वास्थ्य / सार्वजनिक दंत चिकित्सा',
    tel: 'పబ్లిక్ హెల్త్ / పబ్లిక్ హెల్త్ డెంటిస్ట్రీ',
  },
  'Industrial Health': { en: 'Industrial Health', hi: 'औद्योगिक स्वास्थ्य', tel: 'పారిశ్రామిక ఆరోగ్యం' },
  'Occupational Health': { en: 'Occupational Health', hi: 'व्यावसायिक स्वास्थ्य', tel: 'వృత్తి ఆరోగ్యం' },
  'Lifestyle Medicine (IBLM)': {
    en: 'Lifestyle Medicine (IBLM)',
    hi: 'लाइफस्टाइल मेडिसिन (IBLM)',
    tel: 'లైఫ్స్టైల్ మెడిసిన్ (IBLM)',
  },
  'Tropical Medicine / Tropical Medicine and Health': {
    en: 'Tropical Medicine',
    hi: 'उष्णकटिबंधीय चिकित्सा',
    tel: 'ఉష్ణమండల వైద్యం',
  },
  'Ophthalmology / Ophthalmic Medicine and Surgery': {
    en: 'Ophthalmology',
    hi: 'नेत्र विज्ञान',
    tel: 'కంటి వైద్యం',
  },
  'ENT / Otorhinolaryngology (ENT)': {
    en: 'ENT / Otorhinolaryngology',
    hi: 'ईएनटी / कान-नाक-गला',
    tel: 'ENT / చెవి-ముక్కు-గొంతు',
  },
  'Tuberculosis and Chest Diseases': {
    en: 'TB & Chest Diseases',
    hi: 'क्षय एवं वक्ष रोग',
    tel: 'క్షయ & ఛాతీ రోగాలు',
  },
  'Sports Medicine': { en: 'Sports Medicine', hi: 'खेल चिकित्सा', tel: 'క్రీడా వైద్యం' },
  Ayurveda: { en: 'Ayurveda', hi: 'आयुर्वेद', tel: 'ఆయుర్వేదం' },
  Homeopathy: { en: 'Homeopathy', hi: 'होम्योपैथी', tel: 'హోమియోపతి' },
  'Yoga and Naturopathy': {
    en: 'Yoga and Naturopathy',
    hi: 'योग एवं प्राकृतिक चिकित्सा',
    tel: 'యోగ & నేచురోపతి',
  },
  Unani: { en: 'Unani', hi: 'यूनानी', tel: 'యునాని' },
  'Oral and Maxillofacial Surgery': {
    en: 'Oral & Maxillofacial Surgery',
    hi: 'मुख एवं जबड़ा शल्य',
    tel: 'ఔరల్ & మాక్సిలోఫేషియల్ సర్జరీ',
  },
  'Orthodontics and Dentofacial Orthopedics': {
    en: 'Orthodontics & Dentofacial Orthopedics',
    hi: 'ऑर्थोडॉन्टिक्स',
    tel: 'ఆర్థోడాంటిక్స్',
  },
  'Prosthodontics and Crown & Bridge': {
    en: 'Prosthodontics (Crown & Bridge)',
    hi: 'प्रोस्थोडॉन्टिक्स',
    tel: 'ప్రోస్థోడాంటిక్స్',
  },
  'Conservative Dentistry and Endodontics': {
    en: 'Conservative Dentistry & Endodontics',
    hi: 'कंज़र्वेटिव डेंटिस्ट्री एवं एन्डोडॉन्टिक्स',
    tel: 'కన్జర్వేటివ్ డెంటిస్ట్రీ & ఎండోడాంటిక్స్',
  },
  'Pedodontics and Preventive Dentistry': {
    en: 'Pedodontics & Preventive Dentistry',
    hi: 'बाल दंत एवं निवारक दंत',
    tel: 'పీడోడాంటిక్స్ & ప్రివెంటివ్ డెంటిస్ట్రీ',
  },
  'Oral Medicine and Radiology': {
    en: 'Oral Medicine & Radiology',
    hi: 'मुख चिकित्सा एवं रेडियोलॉजी',
    tel: 'ఔరల్ మెడిసిన్ & రేడియాలజీ',
  },
  Dental: { en: 'Dental', hi: 'दंत', tel: 'డెంటల్' },
  Physiotherapy: { en: 'Physiotherapy', hi: 'भौतिक चिकित्सा', tel: 'ఫిజియోథెరపీ' },
  'Nutritionist / Clinical Nutrition': {
    en: 'Nutritionist / Clinical Nutrition',
    hi: 'पोषण विशेषज्ञ / क्लीनिकल न्यूट्रिशन',
    tel: 'న్యూట్రిషనిస్ట్ / క్లినికల్ న్యూట్రిషన్',
  },

  // --- Super Specialities ---
  'Critical Care / Critical Care Medicine': {
    en: 'Critical Care Medicine',
    hi: 'क्रिटिकल केयर',
    tel: 'క్రిటికల్ కేర్',
  },
  'Preventive Cardiology': { en: 'Preventive Cardiology', hi: 'निवारक हृदय रोग', tel: 'నివారక కార్డియాలజీ' },
  'Clinical Cardiology': { en: 'Clinical Cardiology', hi: 'क्लीनिकल कार्डियोलॉजी', tel: 'క్లినికల్ కార్డియాలజీ' },
  Cardiology: { en: 'Cardiology', hi: 'हृदय रोग', tel: 'కార్డియాలజీ' },
  Diabetology: { en: 'Diabetology', hi: 'मधुमेह विज्ञान', tel: 'డయాబెటాలజీ' },
  Neurology: { en: 'Neurology', hi: 'तंत्रिका विज्ञान', tel: 'న్యూరాలజీ' },
  Nephrology: { en: 'Nephrology', hi: 'वृक्क विज्ञान', tel: 'నెఫ్రాలజీ' },
  Endocrinology: { en: 'Endocrinology', hi: 'अंत:स्रावी विज्ञान', tel: 'ఎండోక్రైనాలజీ' },
  Rheumatology: { en: 'Rheumatology', hi: 'गठिया रोग', tel: 'రుమటాలజీ' },
  'Infectious Diseases': { en: 'Infectious Diseases', hi: 'संक्रामक रोग', tel: 'సంసర్గ రోగాలు' },
  Hepatology: { en: 'Hepatology', hi: 'यकृत विज्ञान', tel: 'హెపటాలజీ' },
  'Cardiothoracic and Vascular Surgery': {
    en: 'Cardiothoracic & Vascular Surgery',
    hi: 'हृदय-छाती एवं रक्तवाहिनी शल्य',
    tel: 'కార్డియోథోరాసిక్ & వాస్క్యులర్ సర్జరీ',
  },
  'Vascular Surgery': { en: 'Vascular Surgery', hi: 'रक्तवाहिनी शल्य', tel: 'వాస్క్యులర్ సర్జరీ' },
  'Surgical Gastroenterology': { en: 'Surgical Gastroenterology', hi: 'शल्य जठरांत्र', tel: 'శస్త్ర గ్యాస్ట్రో' },
  'Surgical Oncology': { en: 'Surgical Oncology', hi: 'शल्य ऑन्कोलॉजी', tel: 'శస్త్ర ఆంకాలజీ' },
  'Endocrine Surgery': { en: 'Endocrine Surgery', hi: 'अंत:स्रावी शल्य', tel: 'ఎండోక్రైన్ సర్జరీ' },
  'Plastic & Reconstructive Surgery / Plastic Surgery': {
    en: 'Plastic & Reconstructive Surgery',
    hi: 'प्लास्टिक एवं पुनर्निर्माण शल्य',
    tel: 'ప్లాస్టిక్ & రీకన్స్ట్రక్టివ్ సర్జరీ',
  },
  'Pediatric Surgery': { en: 'Pediatric Surgery', hi: 'बाल शल्य', tel: 'పిడియాట్రిక్ సర్జరీ' },
  Neurosurgery: { en: 'Neurosurgery', hi: 'तंत्रिका शल्य', tel: 'న్యూరో సర్జరీ' },
  Urology: { en: 'Urology', hi: 'मूत्र रोग', tel: 'యూరాలజీ' },
  'Hand Surgery': { en: 'Hand Surgery', hi: 'हाथ की शल्य', tel: 'చేతి శస్త్రచికిత్స' },
  'Trauma Surgery and Critical Care': {
    en: 'Trauma Surgery & Critical Care',
    hi: 'आघात शल्य एवं क्रिटिकल केयर',
    tel: 'ట్రామా సర్జరీ & క్రిటికల్ కేర్',
  },
  'Minimal Access Surgery and Robotic Surgery': {
    en: 'Minimal Access & Robotic Surgery',
    hi: 'न्यूनतम चीरफाड़ एवं रोबोटिक शल्य',
    tel: 'మినిమల్ యాక్సెస్ & రోబోటిక్ సర్జరీ',
  },
  'Hepato-Pancreato-Biliary Surgery': {
    en: 'HPB (Hepato-Pancreato-Biliary) Surgery',
    hi: 'यकृत-अग्न्याशय-पित्त मार्ग शल्य',
    tel: 'హెపాటో-ప్యాంక్రియాటో-బిలియరీ సర్జరీ',
  },
  'Breast and Endocrine Surgery': {
    en: 'Breast & Endocrine Surgery',
    hi: 'स्तन एवं अंत:स्रावी शल्य',
    tel: 'బ్రెస్ట్ & ఎండోక్రైన్ సర్జరీ',
  },
  'Gynaecologic Oncology': { en: 'Gynaecologic Oncology', hi: 'स्त्रीरोग ऑन्कोलॉजी', tel: 'గైనకాలజిక్ ఆంకాలజీ' },
  'Reproductive Medicine': { en: 'Reproductive Medicine', hi: 'प्रजनन चिकित्सा', tel: 'ప్రజనన వైద్యం' },
  'Radiodiagnosis / Medical Radiodiagnosis / Radio Diagnosis': {
    en: 'Radiodiagnosis',
    hi: 'रेडियोडायग्नोसिस',
    tel: 'రేడియోడయాగ్నోసిస్',
  },
  'Nuclear Medicine': { en: 'Nuclear Medicine', hi: 'न्यूक्लियर मेडिसिन', tel: 'న్యూక్లియర్ మెడిసిన్' },
  'Interventional Radiology': {
    en: 'Interventional Radiology',
    hi: 'इंटरवेंशनल रेडियोलॉजी',
    tel: 'ఇంటర్వెన్షనల్ రేడియాలజీ',
  },
  'Pathology / Clinical Pathology / Oral Pathology and Microbiology': {
    en: 'Pathology / Clinical / Oral Pathology & Microbiology',
    hi: 'पैथोलॉजी / क्लीनिकल / ओरल पैथोलॉजी एवं माइक्रोबायोलॉजी',
    tel: 'పాథాలజీ / క్లినికల్ / ఒరల్ పాథాలజీ & మైక్రోబయాలజీ',
  },
  Biochemistry: { en: 'Biochemistry', hi: 'बायोकेमिस्ट्री', tel: 'జీవ రసాయన శాస్త్రం' },
  Microbiology: { en: 'Microbiology', hi: 'माइक्रोबायोलॉजी', tel: 'సూక్ష్మజీవ శాస్త్రం' },
  'Pharmacology / Clinical Pharmacology': {
    en: 'Pharmacology / Clinical Pharmacology',
    hi: 'फार्माकोलॉजी / क्लीनिकल फार्माकोलॉजी',
    tel: 'ఫార్మకాలజీ / క్లినికల్ ఫార్మకాలజీ',
  },
  'Clinical Immunology / Immunology and Immunopathology': {
    en: 'Clinical Immunology',
    hi: 'क्लीनिकल इम्यूनोलॉजी',
    tel: 'క్లినికల్ ఇమ్యూనాలజీ',
  },
  Anatomy: { en: 'Anatomy', hi: 'शरीर रचना विज्ञान', tel: 'శరీర నిర్మాణ శాస్త్రం' },
  Physiology: { en: 'Physiology', hi: 'शरीर क्रिया विज्ञान', tel: 'శరీర క్రియాశాస్త్రం' },
  'Forensic Medicine': { en: 'Forensic Medicine', hi: 'न्याय चिकित्सा', tel: 'న్యాయ వైద్యం' },
  Hematology: { en: 'Hematology', hi: 'रक्त विज्ञान', tel: 'హీమటాలజీ' },
  'Medical Genetics': { en: 'Medical Genetics', hi: 'चिकित्सीय आनुवंशिकी', tel: 'మెడికల్ జనెటిక్స్' },
  'Medical Oncology': { en: 'Medical Oncology', hi: 'चिकित्सीय ऑन्कोलॉजी', tel: 'మెడికల్ ఆంకాలజీ' },
  'Medical Gastroenterology': {
    en: 'Medical Gastroenterology',
    hi: 'चिकित्सीय जठरांत्र',
    tel: 'మెడికల్ గ్యాస్ట్రోఎంటరాలజీ',
  },
  'Immunohematology & Blood Transfusion': {
    en: 'Immunohematology & Blood Transfusion',
    hi: 'इम्यूनोहेमैटोलॉजी एवं रक्त संक्रमण',
    tel: 'ఇమ్యునోహీమటాలజీ & రక్త మార్పిడి',
  },
  'Pain Medicine': { en: 'Pain Medicine', hi: 'वेदना चिकित्सा', tel: 'నొప్పి వైద్యం' },
  'Palliative Medicine / Onco-Anesthesia and Palliative Medicine': {
    en: 'Palliative Medicine',
    hi: 'शमनकारी चिकित्सा',
    tel: 'ప్యాలియేటివ్ మెడిసిన్',
  },
  'Pediatric Cardiology': { en: 'Pediatric Cardiology', hi: 'बाल हृदय रोग', tel: 'పిడియాట్రిక్ కార్డియాలజీ' },
  'Pediatric Neurology': { en: 'Pediatric Neurology', hi: 'बाल तंत्रिका विज्ञान', tel: 'పిడియాట్రిక్ న్యూరాలజీ' },
  'Pediatric Nephrology': { en: 'Pediatric Nephrology', hi: 'बाल वृक्क विज्ञान', tel: 'పిడియాట్రిక్ నెఫ్రాలజీ' },
  'Pediatric Gastroenterology': {
    en: 'Pediatric Gastroenterology',
    hi: 'बाल जठरांत्र',
    tel: 'పిడియాట్రిక్ గ్యాస్ట్రోఎంటరాలజీ',
  },
  Neonatology: { en: 'Neonatology', hi: 'नवजात शिशु विज्ञान', tel: 'నియోనాటాలజీ' },
  'Child Health': { en: 'Child Health', hi: 'बाल स्वास्थ्य', tel: 'బాల ఆరోగ్యం' },
};

/** normalize incoming appLanguage to one of 'en' | 'hi' | 'tel' */
function normalizeLang(l?: string): Lang {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
}

const SelectIssue: React.FC<SelectIssueProps> = ({ navigation }) => {
  const currentUserDetails = useSelector((state: any) => state.currentUser);
  const language = currentUserDetails?.appLanguage;
  const lang: Lang = normalizeLang(language);

  const [searchText, setSearchText] = useState('');
  const [specializations, setSpecializations] = useState<ApiSpecialization[]>([]);
  const [filteredSpecialties, setFilteredSpecialties] = useState<Specialty[]>([]);
  const [filteredSuperSpecialties, setFilteredSuperSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSpecializations = async () => {
    try {
      setIsLoading(true);
      const res: any = await AuthFetch(ENDPOINTS.GET_SPECIALIZATIONS, null);
      console.log("555", res);
      if (res?.status === 'success' && res?.data?.success) {
        const specializationList: ApiSpecialization[] = res?.data?.data || [];
        setSpecializations(specializationList);
        const activeSpecializations = specializationList?.filter(spec => spec.isActive === 1);
        const matchedSpecialties: Specialty[] = activeSpecializations?.map(spec => ({
          id: spec._id,
          name: spec.name,
          displayName: spec.name,
          image: { uri: spec.imageUrl },
        }));
        setFilteredSpecialties(matchedSpecialties);
        setFilteredSuperSpecialties([]);
      } else {
        throw new Error('Failed to fetch specializations data');
      }
    } catch (error) {
      // Fallback to empty arrays if API call fails
      setFilteredSpecialties([]);
      setFilteredSuperSpecialties([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecializations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter based on search text (UNCHANGED: uses canonical English name)
  const searchFilteredSpecialties = filteredSpecialties.filter(specialty =>
    specialty.name.toLowerCase().includes(searchText.toLowerCase()) ||
    specialty.displayName.toLowerCase().includes(searchText.toLowerCase())
  );
  const searchFilteredSuperSpecialties = filteredSuperSpecialties.filter(specialty =>
    specialty.name.toLowerCase().includes(searchText.toLowerCase()) ||
    specialty.displayName.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderSpecialtyGrid = (specialtiesList: Specialty[]) => {
    return (
      <View style={styles.grid}>
        {specialtiesList?.map((specialty) => (
          <TouchableOpacity
            key={specialty.id}
            style={styles.specialtyCard}
            onPress={() => navigation.navigate('FindDoctor', { specialty: specialty?.name })} // pass canonical English (UNCHANGED)
          >
            <View style={styles.imageContainer}>
              <Image source={specialty?.image} style={styles.specialtyImage} />
            </View>
            {/* Display commonName from API */}
            <Text style={styles.specialtyText} numberOfLines={2}>
              {specialty.displayName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{UI.title[lang]}</Text>
       
      </View> */}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={UI.searchPlaceholder[lang]}
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#1F2937" />
          <Text style={styles.loaderText}>{UI.loading[lang]}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Specialities Section */}
          {(searchText === '' || searchFilteredSpecialties.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{UI.sectionSpecialities[lang]}</Text>
              {renderSpecialtyGrid(searchText === '' ? filteredSpecialties : searchFilteredSpecialties)}
            </View>
          )}

          {/* Super Specialities Section */}
          {(searchText === '' || searchFilteredSuperSpecialties.length > 0) && filteredSuperSpecialties.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{UI.sectionSuperSpecialities[lang]}</Text>
              {renderSpecialtyGrid(searchText === '' ? filteredSuperSpecialties : searchFilteredSuperSpecialties)}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDFFF7',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: isTablet ? SPACING.lg : SPACING.md,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...LAYOUT.shadow.sm,
    minHeight: moderateScale(40),
  },
  searchIcon: {
    marginRight: SPACING.sm,
    fontSize: moderateScale(14),
    color: '#999',
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#1F2937',
    paddingVertical: SPACING.xxs,
  },
  closeIcon: {
    fontSize: moderateScale(14),
    color: '#999',
    paddingLeft: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
  },
  section: {
    marginBottom: isTablet ? SPACING.lg : SPACING.md,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: SPACING.sm,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    backgroundColor: '#EDFFF7',
    paddingVertical: SPACING.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.sm,
    justifyContent: 'flex-start',
  },
  specialtyCard: {
    width: isTablet ? '20%' : isSmallDevice ? '33.33%' : '25%',
    aspectRatio: 0.8,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: SPACING.xs,
  },
  imageContainer: {
    width: isTablet ? responsiveWidth(12) : responsiveWidth(16),
    height: isTablet ? responsiveWidth(12) : responsiveWidth(16),
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...LAYOUT.shadow.sm,
    marginBottom: SPACING.xs,
  },
  specialtyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  specialtyText: {
    fontSize: moderateScale(10),
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: moderateScale(12),
    paddingHorizontal: SPACING.xxs,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SAFE_AREA.safeBottom,
  },
  loaderText: {
    marginTop: SPACING.sm,
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
});

export default SelectIssue;