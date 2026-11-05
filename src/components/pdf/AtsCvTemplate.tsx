import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { TailoredCvData } from '@/lib/gemini';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: '#111827',
    lineHeight: 1.35,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#2563EB',
    paddingBottom: 8,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
    fontFamily: 'Helvetica-Bold',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 10,
    fontSize: 8.5,
    color: '#475569',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    textTransform: 'uppercase',
    borderBottomWidth: 0.75,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 2,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  summaryText: {
    textAlign: 'justify',
    color: '#334155',
  },
  jobBlock: {
    marginBottom: 8,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  jobRole: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#0F172A',
  },
  jobCompany: {
    fontFamily: 'Helvetica-Bold',
    color: '#2563EB',
  },
  jobDates: {
    fontSize: 8.5,
    color: '#64748B',
  },
  bulletList: {
    marginTop: 3,
    paddingLeft: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  bulletSymbol: {
    width: 8,
    color: '#2563EB',
    fontSize: 8,
  },
  bulletText: {
    flex: 1,
    color: '#334155',
  },
  skillsCategory: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  categoryLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 110,
    color: '#0F172A',
  },
  skillsItems: {
    flex: 1,
    color: '#334155',
  },
  educationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
});

interface AtsCvTemplateProps {
  data: TailoredCvData;
}

export const AtsCvDocument: React.FC<AtsCvTemplateProps> = ({ data }) => {
  return (
    <Document title={`${data.fullName} - Resume`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.fullName}</Text>
          <Text style={styles.title}>{data.headline}</Text>
          <View style={styles.contactRow}>
            {data.contact.email && <Text>✉ {data.contact.email}</Text>}
            {data.contact.phone && <Text>☎ {data.contact.phone}</Text>}
            {data.contact.location && <Text>📍 {data.contact.location}</Text>}
            {data.contact.linkedin && <Text>in: {data.contact.linkedin}</Text>}
            {data.contact.portfolio && <Text>🌐 {data.contact.portfolio}</Text>}
          </View>
        </View>

        {/* Summary */}
        {data.professionalSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{data.professionalSummary}</Text>
          </View>
        )}

        {/* Core Competencies & Skills */}
        {data.skills && data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills & Competencies</Text>
            {data.skills.map((cat, idx) => (
              <View key={idx} style={styles.skillsCategory}>
                <Text style={styles.categoryLabel}>{cat.category}:</Text>
                <Text style={styles.skillsItems}>{cat.items.join(', ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {data.experiences && data.experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {data.experiences.map((exp, idx) => (
              <View key={idx} style={styles.jobBlock}>
                <View style={styles.jobHeader}>
                  <Text>
                    <Text style={styles.jobRole}>{exp.role}</Text> |{' '}
                    <Text style={styles.jobCompany}>{exp.company}</Text>
                    {exp.location ? ` - ${exp.location}` : ''}
                  </Text>
                  <Text style={styles.jobDates}>
                    {exp.startDate} – {exp.endDate}
                  </Text>
                </View>
                <View style={styles.bulletList}>
                  {exp.bulletPoints.map((pt, pIdx) => (
                    <View key={pIdx} style={styles.bulletItem}>
                      <Text style={styles.bulletSymbol}>•</Text>
                      <Text style={styles.bulletText}>{pt}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, idx) => (
              <View key={idx} style={styles.educationItem}>
                <Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>{edu.degree}</Text> in {edu.field},{' '}
                  {edu.institution}
                </Text>
                {edu.gradYear && <Text style={styles.jobDates}>{edu.gradYear}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications & Training</Text>
            <View style={styles.bulletList}>
              {data.certifications.map((cert, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <Text style={styles.bulletSymbol}>•</Text>
                  <Text style={styles.bulletText}>{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};
