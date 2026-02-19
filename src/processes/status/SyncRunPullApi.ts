/*
 * Copyright 2021 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

import moment = require('moment');
import {
  SpinalContext,
  SpinalGraph,
  SpinalGraphService,
  SpinalNode,
  SpinalNodeRef,
  SPINAL_RELATION_PTR_LST_TYPE,
} from 'spinal-env-viewer-graph-service';

import type OrganConfigModel from '../../model/OrganConfigModel';

import serviceDocumentation, {
  attributeService,
} from 'spinal-env-viewer-plugin-documentation-service';


import { SpinalAttribute } from 'spinal-models-documentation';
import { NetworkService, SpinalBmsEndpoint } from 'spinal-model-bmsnetwork';
import {
  InputDataDevice,
  InputDataEndpoint,
  InputDataEndpointGroup,
  InputDataEndpointDataType,
  InputDataEndpointType,
} from '../../model/InputData/InputDataModel/InputDataModel';


import { IZone } from '../../interfaces/api/IZone';
import { IEquipment } from '../../interfaces/api/IEquipment';
import groupManagerService from 'spinal-env-viewer-plugin-group-manager-service';



import { ArdSession } from '../../services/client/ArdSession';
import { ArdSoapClient } from '../../services/client/ArdSoapClient';

import { SpinalServiceTimeseries } from 'spinal-model-timeseries';

import { listReaders } from '../../services/client/calls/listAccessPoint';
import { listDeviceReaders } from '../../services/client/calls/listDeviceReaders';
import { isSiteMonitored } from '../../services/client/calls/isSiteMonitored';
import { listCarriers } from '../../services/client/calls/listCarriers';
import { listEvents, getAllEvents } from '../../services/client/calls/listEvents';
import { listAlarms } from '../../services/client/calls/listAlarms';
import { listCarrierGroups } from '../../services/client/calls/listCarrierGroups';
import { recordToObject } from '../../utils/recordToObj';
import { IOccupant, spinalOccupantService } from "spinal-model-occupant"


/**
 * Main purpose of this class is to pull data from client.
 *
 * @export
 * @class SyncRunPull
 */
export class SyncRunPullApi {
  graph: SpinalGraph<any>;
  config: OrganConfigModel;
  interval: number;
  running: boolean;

  private ardSession: ArdSession;
  private ardSoapClient: ArdSoapClient;

  // Services spinal
  nwService: NetworkService;
  timeseriesService: SpinalServiceTimeseries;

  // Contexts spinal
  nwContext: SpinalContext<any>;


  // Level 1 Children Nodes
  nwVirtual: SpinalNode<any>;



  constructor(graph: SpinalGraph<any>, config: OrganConfigModel) {
    this.graph = graph;
    this.config = config;
    this.running = false;
    this.nwService = new NetworkService(true);
    this.ardSession = ArdSession.getInstance();
    this.timeseriesService = new SpinalServiceTimeseries();
  }

  private waitFct(nb: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(
        () => {
          resolve();
        },
        nb >= 0 ? nb : 0
      );
    });
  }

  async getContextByName(name: string): Promise<SpinalContext<any>> {
    const contexts = await this.graph.getChildren();
    for (const context of contexts) {
      if (context.info.name.get() === name) {
        // @ts-ignore
        SpinalGraphService._addNode(context);
        return context;
      }
    }
    throw new Error(`Context with name ${name} Not found`);
  }

  async initRequiredNodes(): Promise<void> {
    this.nwContext = await this.getContextByName(process.env.NETWORK_NAME);


    this.nwVirtual = (await this.nwContext.getChildrenInContext()).find((node) => node.getName().get() === process.env.VIRTUAL_NETWORK_NAME);
    if (!this.nwVirtual) throw new Error('Virtual Network Node Not found');

    SpinalGraphService._addNode(this.nwVirtual);

  }


  async createEndpoint(
    deviceNode: SpinalNode<any>,
    endpointName: string,
    initialValue: number | string | boolean,
    unit = ''
  ): Promise<SpinalNode<any>> {

    const endpointNodeModel = new InputDataEndpoint(
      endpointName,
      initialValue ?? 0,
      unit,
      InputDataEndpointDataType.Real,
      InputDataEndpointType.Other
    );

    const endpointInfo = await this.nwService.createNewBmsEndpoint(deviceNode.getId().get(), endpointNodeModel);

    const realNode = SpinalGraphService.getRealNode(endpointInfo.id.get());
    // SpinalGraphService._addNode(realNode);


    await this.timeseriesService.pushFromEndpoint(
      endpointInfo.id.get(),
      initialValue as number
    );
    await attributeService.updateAttribute(
      realNode,
      'default',
      'timeSeries maxDay',
      { value: '14' }
    );
    return realNode;
  }


  // async createChargingStationDevicesAndEndpoints(chargingStationData : IChargingStation[], connectorData : ICSConnector[]){
  //   const existingDevices = await this.nwVirtual.getChildrenInContext(this.nwContext);
  //   for ( const cs of chargingStationData) {
  //     const csIdentity = cs.identity;
  //     let deviceNode = existingDevices.find((node) => node.getName().get() === csIdentity);
  //     if(!deviceNode) {
  //       console.log(`Device for Charging Station ${cs.name} not found, creating...`);
  //       const deviceNodeModel = new InputDataDevice(csIdentity);
  //       deviceNode = await this.createDevice(csIdentity, 'ChargingStation');
  //       // create endpoints
  //       this.createEndpoint(deviceNode, 'connected', cs.connected);
  //       this.createEndpoint(deviceNode, 'lastHeartbeat', new Date(cs.lastHeartbeat).getTime());
  //       const csConnectors = connectorData.filter(conn => conn.chargingStationIdentity === cs.identity);
  //       for ( const csConnector of csConnectors) {
  //         const endpointStatusName = `Connector_${csConnector.id}_Status`;
  //         const code = this.statusEnumerationMap.get(csConnector.status) ?? this.statusEnumerationMap.get('Unknown');
  //         this.createEndpoint(deviceNode, endpointStatusName, code);
  //       }
  //     }
  //   }
  // }

  // async createEnergyCounterDevicesAndEndpoints(energyCounterData : IEquipment[]){
  //   const existingDevices = await this.nwVirtual.getChildrenInContext(this.nwContext);
  //   for ( const ec of energyCounterData) {
  //     let deviceNode = existingDevices.find((node) => node.getName().get() === ec.name);
  //     if(!deviceNode) {
  //       console.log(`Device for Energy Counter ${ec.name} not found, creating...`);
  //       deviceNode = await this.createDevice(ec.name, 'EnergyCounter');
  //       // create endpoints
  //       this.createEndpoint(deviceNode, 'connected', ec.connected);
  //       // create endpoints for l1 , l2 , l3 currents and energy consumptions
  //       this.createEndpoint(deviceNode, 'Current_L1', ec.values.currents.l1.value,ec.values.currents.l1.unit);
  //       this.createEndpoint(deviceNode, 'Current_L2', ec.values.currents.l2.value,ec.values.currents.l2.unit);
  //       this.createEndpoint(deviceNode, 'Current_L3', ec.values.currents.l3.value,ec.values.currents.l3.unit);
  //       this.createEndpoint(deviceNode, 'Energy_Consumption', ec.values.energy.value, ec.values.energy.unit);        
  //     }
  //   }
  // }

  async createReaderDevices(readers: any[]) {
    const existingDevices = await this.nwVirtual.getChildrenInContext(this.nwContext);
    for (const reader of readers) {
      let deviceNode = existingDevices.find((node) => node.getName().get() === reader.uid);
      if (!deviceNode) {
        console.log(`Device for Reader ${reader.uid} not found, creating...`);
        deviceNode = await this.createDevice(reader.uid, 'deviceReader');
        await attributeService.createOrUpdateAttrsAndCategories(
          deviceNode,
          'default',
          {
            variable: 'Reader',
            uid: reader.uid,
            description: reader.description || '',
            creationdate: reader.creationDate || '',
            modificationdate: reader.modificationDate || '',
            doors: reader.doors || ''
          }

        );
      }
    }

  }

  async createMonitoringDeviceAndEndpoint(isMonitored: boolean) {
    const existingDevices = await this.nwVirtual.getChildrenInContext(this.nwContext);
    let deviceNode = existingDevices.find((node) => node.getName().get() === 'SiteMonitoringDevice');

    if (!deviceNode) {
      deviceNode = await this.createDevice('SiteMonitoringDevice', 'deviceMonitoring');
      const endpointNode = await this.createEndpoint(deviceNode, 'isSiteMonitored', isMonitored);
    }

  }

  async createOccupantData(carriers: any[]) {
    const carrierContext = await spinalOccupantService.createOrGetContext(process.env.CARRIER_CONTEXT_NAME);
    const occupants = await spinalOccupantService.getOccupants(process.env.CARRIER_CONTEXT_NAME)
    for (const carrier of carriers) {
      let foundOcc = occupants.find((occ) => occ.getName().get() === carrier.uid);
      if (!foundOcc) {
        const infoOcc: IOccupant = {
          first_name: carrier.firstname || "",
          last_name: carrier.lastname || "",
          occupantId: carrier.uid,
          email: carrier.email || '',
          serviceName: '',
          companyName: '',
          phoneNumber: carrier.telephone || ''
        }
        foundOcc = await spinalOccupantService.addOccupant(infoOcc, process.env.CARRIER_CONTEXT_NAME);

        await serviceDocumentation.createOrUpdateAttrsAndCategories(foundOcc, 'ARD',
          {
            uid: carrier.uid,
            rid: carrier.rid || "",
            username: carrier.username || "",
            firstname: carrier.firstname || "",
            lastname: carrier.lastname || "",
            disabled: carrier.disabled,
            begindate: carrier.begindate || "",
            enddate: carrier.enddate || "",
            telephone: carrier.telephone || "",
            email: carrier.email || "",
            usergroup: carrier.usergroup ?? "",
          }
        )
      }

    }


  }



  async createDevice(deviceName: string, type: string) {
    const deviceNodeModel = new InputDataDevice(deviceName, type);
    const res = await this.nwService.createNewBmsDevice(this.nwVirtual.getId().get(), deviceNodeModel);
    const createdNode = SpinalGraphService.getRealNode(res.id.get());
    console.log('Created device ', createdNode.getName().get());
    return createdNode;
  }


  async updateEnergyCounterDevices(energyCounterData: IEquipment[]) {
    const existingDevices = await this.nwVirtual.getChildrenInContext(this.nwContext);
    for (const ec of existingDevices) {
      const matchingEc = energyCounterData.find((apiEc) => {
        return apiEc.name === ec.getName().get();
      });
      if (!matchingEc) {
        continue;
      }

      const endpoints = await ec.getChildren('hasBmsEndpoint');
      const connectedEndpoint = endpoints.find((ep) => ep.getName().get() === 'connected');
      if (connectedEndpoint) {
        await this.updateEndpoint(connectedEndpoint, matchingEc.connected);
      }
      // update endpoints for l1 , l2 , l3 currents and energy consumptions
      const currentL1Endpoint = endpoints.find((ep) => ep.getName().get() === 'Current_L1');
      if (currentL1Endpoint) {
        await this.updateEndpoint(currentL1Endpoint, matchingEc.values.currents.l1.value);
      }
      const currentL2Endpoint = endpoints.find((ep) => ep.getName().get() === 'Current_L2');
      if (currentL2Endpoint) {
        await this.updateEndpoint(currentL2Endpoint, matchingEc.values.currents.l2.value);
      }
      const currentL3Endpoint = endpoints.find((ep) => ep.getName().get() === 'Current_L3');
      if (currentL3Endpoint) {
        await this.updateEndpoint(currentL3Endpoint, matchingEc.values.currents.l3.value);
      }
      const energyConsumptionEndpoint = endpoints.find((ep) => ep.getName().get() === 'Energy_Consumption');
      if (energyConsumptionEndpoint) {
        await this.updateEndpoint(energyConsumptionEndpoint, matchingEc.values.energy.value);
      }

    }
  }


  async updateEndpoint(endpointNode: SpinalNode<any>, newValue: number | string | boolean) {
    SpinalGraphService._addNode(endpointNode);
    await this.nwService.setEndpointValue(endpointNode.getId().get(), newValue);
    console.log(`Updated endpoint ${endpointNode.getName().get()} with value ${newValue}`);
  }

  async init(): Promise<void> {
    console.log('Initiating SyncRunPull');
    try {

      await this.nwService.init(this.graph, { contextName: process.env.NETWORK_NAME, contextType: "Network", networkName: process.env.VIRTUAL_NETWORK_NAME, networkType: "NetworkVirtual" });
      await this.initRequiredNodes();
      console.log('Required nodes initialized');

      const readerRecords = await listDeviceReaders();
      console.log('Readers fetched:', readerRecords.count);

      const readerArrays = readerRecords.records.item; // all readers
      const readers = readerArrays.map(readerArray =>
        recordToObject(readerArray.item)
      );
      // console.log('Readers:', readers);
      await this.createReaderDevices(readers);

      const isMonitored = await isSiteMonitored();
      this.createMonitoringDeviceAndEndpoint(isMonitored);

      const carrierRecords = await listCarriers();
      console.log('Carriers fetched:', carrierRecords.count);
      const carrierArrays = carrierRecords.records.item; // all carriers

      const carriers = carrierArrays.map(carrierArray =>
        recordToObject(carrierArray.item)
      );

      // console.log('Carriers:', carriers);
      await this.createOccupantData(carriers);



      const eventRecords = await getAllEvents();
      console.log('Events fetched:', eventRecords.count);
      const eventArrays = eventRecords.records?.item ?? [] // all events

      const events = eventArrays.map(eventArray =>
        recordToObject(eventArray.item)
      );

      console.log('Total events:', events.length);

      // Group events by their eventtype
      const eventsByType: { [key: string]: any[] } = {};
      for (const event of events) {
        const type = event.eventtype;
        if (!eventsByType[type]) {
          eventsByType[type] = [];
        }
        eventsByType[type].push(event);
      }


      // Now you can use eventsByType, where each key is an eventtype and the value is an array of events of that type
      //console.log('Grouped events by eventtype:', eventsByType);
      for (const [eventType, eventsArr] of Object.entries(eventsByType)) {
        const count = eventsArr.length;
        const description = eventsArr[0]?.description || 'No description';
        console.log(`Event type: ${eventType}, count: ${count}, example description: ${description}`);
      }

      console.log(eventsByType)

      // const alarmRecords = await listAlarms();
      // console.log('Alarms fetched:', alarmRecords.count);
      // const alarmArrays = alarmRecords.records?.item ?? [] // all alarms

      // const alarms = alarmArrays.map(alarmArray =>
      //   recordToObject(alarmArray.item)
      // );
      // console.log('Alarms:', alarms);



      // const carrierGroupRecords = await listCarrierGroups();
      // const carrierGroupArrays = carrierGroupRecords.records.item; // all carrier groups

      // const carrierGroups = carrierGroupArrays.map(carrierGroupArray =>
      //   recordToObject(carrierGroupArray.item)
      // );

      // console.log('Carrier Groups:', carrierGroups);


      await this.ardSession.logout();



      this.config.lastSync.set(Date.now());
      console.log('Init DONE !');

    } catch (e) {
      console.error(e);
    }
  }

  async run(): Promise<void> {
    console.log('Starting run...');
    this.running = true;
    const timeout = parseInt(process.env.PULL_INTERVAL);
    await this.waitFct(timeout);
    while (true) {
      if (!this.running) break;
      const before = Date.now();
      try {
        console.log('Run...');
        console.log('... Run finished !');
        this.config.lastSync.set(Date.now());
      } catch (e) {
        console.error(e);
        await this.waitFct(1000 * 60);
      } finally {
        const delta = Date.now() - before;
        const timeout = parseInt(process.env.PULL_INTERVAL) - delta;
        await this.waitFct(timeout);
      }
    }
  }

  stop(): void {
    this.running = false;
  }
}
export default SyncRunPullApi;
