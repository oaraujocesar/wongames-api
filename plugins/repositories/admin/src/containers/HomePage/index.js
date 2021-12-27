import React, { useState, useEffect, memo } from "react";
import styled from "styled-components";
import axios from "axios";

import pluginId from "../../pluginId";

import { Table } from "@buffetjs/core";
import { Header } from "@buffetjs/custom";

const Wrapper = styled.div`
  padding: 18px 30px;
  p {
    margin-top: 1rem;
  }
`;

const HomePage = () => {
  const [rows, setRows] = useState([]);

  const headers = [
    {
      name: "Name",
      value: "name",
    },
    {
      name: "Description",
      value: "description",
    },
    {
      name: "URL",
      value: "html_url",
    },
  ];

  useEffect(() => {
    axios
      .get("https://api.github.com/users/React-avancado/repos")
      .then(({ data }) => setRows(data))
      .catch((error) =>
        strapi.notification.error(`Ops... GitHub API error, ${error}`)
      );
  }, []);

  return (
    <Wrapper>
      <Header
        title={{ label: "React Avançado Repositories" }}
        content="A list of our repositories in React Avançado course."
      />
      <Table headers={headers} rows={rows} />
    </Wrapper>
  );
};

export default memo(HomePage);
