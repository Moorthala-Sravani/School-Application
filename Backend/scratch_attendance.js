const fs = require('fs');

const filepath = 'c:/Users/Sravani/Desktop/App/MyApplication/src/screens/Teacher/TeacherAttendanceScreen.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

const importsOld = "import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';";
const importsNew = "import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, ActivityIndicator } from 'react-native';\nimport { useSelector } from 'react-redux';\nimport { RootState } from '../../store';\nimport api from '../../config/api';";

content = content.replace(importsOld, importsNew);

const logicOld = `const TeacherAttendanceScreen = ({ navigation }: any) => {
  // Generate 50 dummy students
  const [students, setStudents] = useState(
    Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: \`Student \${i + 1}\`,
      rollNo: \`10\${i < 9 ? '0' : ''}\${i + 1}\`,
      status: 'present' // 'present', 'absent', 'leave'
    }))
  );`;

const logicNew = `const TeacherAttendanceScreen = ({ navigation }: any) => {
  const { assigned_classes } = useSelector((state: RootState) => state.teacherProfile);
  const selectedClass = assigned_classes?.[0] || '6-A';
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get(\`/profile/students/\${selectedClass}\`);
        const formattedStudents = response.data.map((s: any, index: number) => ({
          id: s.parent_id,
          name: s.name,
          rollNo: \`10\${index < 9 ? '0' : ''}\${index + 1}\`,
          status: 'present'
        }));
        setStudents(formattedStudents);
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClass]);`;

content = content.replace(logicOld, logicNew);

const oldSave = `  const handleSave = () => {
    Alert.alert('Success', 'Attendance saved successfully for Class 6-A');
    navigation.goBack();
  };`;
const newSave = `  const handleSave = () => {
    Alert.alert('Success', \`Attendance saved successfully for Class \${selectedClass}\`);
    navigation.goBack();
  };`;

content = content.replace(oldSave, newSave);

const oldClassStr = `        <Text style={styles.infoClass}>Class 6-A</Text>`;
const newClassStr = `        <Text style={styles.infoClass}>Class {selectedClass}</Text>`;

content = content.replace(oldClassStr, newClassStr);

const oldContainer = `<ScrollView contentContainerStyle={styles.container}>
        {students.map((student, index) => (`;
const newContainer = `<ScrollView contentContainerStyle={styles.container}>
        {loading ? <ActivityIndicator size="large" color="#2980B9" style={{marginTop: 50}} /> :
         students.map((student, index) => (`;

content = content.replace(oldContainer, newContainer);

// Don't forget to close the bracket
content = content.replace(`))}
      </ScrollView>`, `))}
      </ScrollView>`);

fs.writeFileSync(filepath, content);
