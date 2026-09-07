# PN-LISTEN-1 Passive Circumferential Array — STEP-like ASCII (ISO-10303 flavor)

## HEADER
FILE_DESCRIPTION(('PN-LISTEN-1 Passive Circumferential Array'),'2;1');
FILE_NAME('palladium-null-array.step','2026-09-06T00:00:00',('Palladium Null'),('Palladium Null'),'CAD Exporter 0.1','','');
FILE_SCHEMA(('PALLADIUM_CAD_SCHEMA'));

## DATA
/* Foundation Ring — 14 m diameter RF-transparent perimeter */
#1= IFCFOOTING('FOUNDATION',$,$,$,#10,#20,$,.NOTDEFINED.);
#10= IFCAXIS2PLACEMENT3D(#11,$,$);
#11= IFCCARTESIANPOINT((0.0,0.0,-0.2));
#20= IFCPROPERTYSET('PSET_FOUNDATION',$,('MassKg',50600),('Material','Concrete C40/50'),('Doctrine','RX-ONLY'));

/* Faraday Vault — buried equipment room */
#2= IFCBUILDINGELEMENT('VAULT',$,$,$,#30,#40,$,.NOTDEFINED.);
#30= IFCAXIS2PLACEMENT3D(#31,$,$);
#31= IFCCARTESIANPOINT((0.0,0.0,-1.2));
#40= IFCPROPERTYSET('PSET_VAULT',$,('MassKg',38500),('Material','Concrete+Steel'),('Contains','Receivers,Clocks,Fusion,NullBus'),('Exciter','ABSENT'));

/* Receiver & Processing Racks */
#3= IFCBUILDINGELEMENT('EQUIPMENT_RACKS',$,$,$,#50,#60,$,.NOTDEFINED.);
#50= IFCAXIS2PLACEMENT3D(#51,$,$);
#51= IFCCARTESIANPOINT((0.0,0.0,-0.2));
#60= IFCPROPERTYSET('PSET_RACKS',$,('MassKg',1400),('Material','Aluminium 6061'),('Contents','SDR,PTP,Fusion,NullBus'));

/* 24× Receive Elements — schematic Vivaldi-notch shapes on 7 m radius */
#4= IFCBUILDINGELEMENT('ELEMENT_0',$,$,$,#70,#80,$,.NOTDEFINED.);
#70= IFCAXIS2PLACEMENT3D(#71,#72,#73);
#71= IFCCARTESIANPOINT((7.0,0.0,1.1));
#72= IFCDIRECTION((0.0,0.0,1.0));
#73= IFCDIRECTION((1.0,0.0,0.0));
#80= IFCPROPERTYSET('PSET_ELEMENT',$,('MassKg',85),('Material','RF-Composite'),('Type','Vivaldi-Notch RX'),('TX','NONE'));

... elements 1–23 follow same pattern with rotated placements ...

/* Calibration Tower — optical/GNSS time transfer */
#28= IFCBUILDINGELEMENT('CAL_TOWER',$,$,$,#290,#300,$,.NOTDEFINED.);
#290= IFCAXIS2PLACEMENT3D(#291,$,$);
#291= IFCCARTESIANPOINT((10.0,0.0,3.0));
#300= IFCPROPERTYSET('PSET_TOWER',$,('MassKg',1250),('Material','Steel S355'),('Beacon','Optical/GNSS'),('TX','NONE'));

/* Civil Shelter Head-House S-01 — 40 m from array */
#29= IFCBUILDING('SHELTER_S01',$,$,$,#310,#320,$,$,$,.NOTDEFINED.);
#310= IFCAXIS2PLACEMENT3D(#311,$,$);
#311= IFCCARTESIANPOINT((40.0,0.0,-15.0));
#320= IFCPROPERTYSET('PSET_SHELTER',$,('MassKg',17600),('Capacity',2400),('Role','CIVIL_DEFENSE'),('DistanceFromArray_m',40));

/* RF-Transparent Security Fence */
#30= IFCFENCE('PERIMETER_FENCE',$,$,$,#330,#340,$,.NOTDEFINED.);
#330= IFCAXIS2PLACEMENT3D(#331,$,$);
#331= IFCCARTESIANPOINT((0.0,0.0,0.1));
#340= IFCPROPERTYSET('PSET_FENCE',$,('MassKg',920),('Material','RF-Composite Mesh'),('Conductive','FALSE'));

/* Signage */
#31= IFCSIGN('SIGN_ARRAY',$,$,$,#350,#360,$,.NOTDEFINED.);
#350= IFCAXIS2PLACEMENT3D(#351,$,$);
#351= IFCCARTESIANPOINT((0.0,12.0,0.0));
#360= IFCPROPERTYSET('PSET_SIGN',$,('Text','PN-LISTEN-1 PASSIVE RX ARRAY DUAL-USE PHYSICS'));

#32= IFCSIGN('SIGN_DOCTRINE',$,$,$,#370,#380,$,.NOTDEFINED.);
#370= IFCAXIS2PLACEMENT3D(#371,$,$);
#371= IFCCARTESIANPOINT((0.0,10.5,0.0));
#380= IFCPROPERTYSET('PSET_SIGN',$,('Text','NO TRANSMITTER ON SITE DOCTRINE: NULL BUS'));

#33= IFCSIGN('SIGN_SHELTER',$,$,$,#390,#400,$,.NOTDEFINED.);
#390= IFCAXIS2PLACEMENT3D(#391,$,$);
#391= IFCCARTESIANPOINT((40.0,2.0,-15.0));
#400= IFCPROPERTYSET('PSET_SIGN',$,('Text','CIVIL SHELTER S-01 CAPACITY 2400'));

/* Interfaces — explicitly no weapons interface */
#40= IFCPORT('RF_IN',$,$,$,('Type','24x Wideband RF 0.1-6 GHz'),('Direction','IN'),('Notes','Receive only'));
#41= IFCPORT('PTP_CLOCK',$,$,$,('Type','IEEE 1588v2 + White Rabbit'),('Direction','IN'));
#42= IFCPORT('DATA_OUT',$,$,$,('Type','10/100 GbE'),('Direction','OUT'),('Notes','Fused picture + IQ; no fire-control bus'));
#43= IFCPORT('WEAPONS',$,$,$,('Value',$,NULL),('Doctrine','EXPLICITLY_NULL'));

/* Compliance */
#44= IFCPROPERTYSET('PSET_COMPLIANCE',$,('Transmitter','NONE'),('Exciter','ABSENT'),('Doctrine','RECEIVE-ONLY'));

ENDSEC;
END-ISO-10303-21;